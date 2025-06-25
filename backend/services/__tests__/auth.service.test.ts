import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest';
import { authService } from '../auth.service.js';
import { User, IUserDocument } from '../../models/user.model.js';
import { redis } from '../../lib/redis.js';
import { queueEmail } from '../../lib/email-queue.js';
import { AppError } from '../../utils/AppError.js';
import crypto from 'crypto';
import mongoose from 'mongoose';

vi.mock('../../models/user.model.js');
vi.mock('../../lib/redis.js');
vi.mock('../../lib/email-queue.js');

type MockUserDocument = Partial<IUserDocument> & {
  save: MockedFunction<() => Promise<void>>;
  generateEmailVerificationToken: MockedFunction<() => string>;
};

const createMockUser = (overrides: Partial<MockUserDocument> = {}): MockUserDocument => {
  const defaultUser: MockUserDocument = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Test User',
    email: 'test@example.com',
    role: 'customer',
    emailVerified: false,
    save: vi.fn().mockResolvedValue(undefined),
    generateEmailVerificationToken: vi.fn().mockReturnValue('verification-token'),
    ...overrides,
  };
  return defaultUser;
};

describe('AuthService', () => {
  const mockRedis = {
    incr: vi.fn() as MockedFunction<() => Promise<number>>,
    expire: vi.fn() as MockedFunction<() => Promise<number>>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(redis, mockRedis);
  });

  describe('verifyEmail', () => {
    it('should verify user email with valid token', async () => {
      const token = 'valid-token';
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      const mockUser = createMockUser({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
      });

      vi.spyOn(User, 'findOne').mockResolvedValue(mockUser as IUserDocument);
      vi.mocked(queueEmail).mockResolvedValue(undefined);

      const result = await authService.verifyEmail(token);

      const findOneSpy = vi.mocked(User.findOne);
      const findOneCalls = findOneSpy.mock.calls;
      void expect(findOneCalls.length).toBe(1);
      const findOneArg = findOneCalls[0]?.[0] as {
        emailVerificationToken: string;
        emailVerificationExpires: { $gt: number };
      };
      void expect(findOneArg.emailVerificationToken).toBe(hashedToken);
      void expect(findOneArg.emailVerificationExpires.$gt).toBeGreaterThan(0);

      void expect(mockUser.emailVerified).toBe(true);
      void expect(mockUser.emailVerificationToken).toBeUndefined();
      void expect(mockUser.emailVerificationExpires).toBeUndefined();
      void expect(mockUser.save).toHaveBeenCalled();

      void expect(queueEmail).toHaveBeenCalledWith('welcomeEmail', { user: mockUser });

      void expect(result).toEqual({
        _id: mockUser._id?.toString(),
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        emailVerified: true,
      });
    });

    it('should throw error for invalid token', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValue(null);

      await expect(authService.verifyEmail('invalid-token')).rejects.toThrow(
        new AppError('Invalid or expired verification token', 400),
      );
    });

    it('should throw error for expired token', async () => {
      const token = 'expired-token';

      vi.spyOn(User, 'findOne').mockResolvedValue(null);

      await expect(authService.verifyEmail(token)).rejects.toThrow(
        new AppError('Invalid or expired verification token', 400),
      );
    });

    it('should handle email queue failure gracefully', async () => {
      const token = 'valid-token';
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      const mockUser = createMockUser({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: new Date(Date.now() + 1000 * 60 * 60),
      });

      const findOneSpy = vi.spyOn(User, 'findOne').mockResolvedValue(mockUser as IUserDocument);
      vi.mocked(queueEmail).mockRejectedValue(new Error('Queue error'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      const result = await authService.verifyEmail(token);

      void expect(findOneSpy).toHaveBeenCalled();
      void expect(result.emailVerified).toBe(true);
      void expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to queue welcome email:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('resendVerificationEmail', () => {
    it('should resend verification email for unverified user', async () => {
      const userId = 'user-123';
      const mockUser = createMockUser({
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      mockUser.generateEmailVerificationToken.mockReturnValue('new-token');

      vi.spyOn(User, 'findById').mockResolvedValue(mockUser as IUserDocument);
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      vi.mocked(queueEmail).mockResolvedValue(undefined);

      await authService.resendVerificationEmail(userId);

      const findByIdSpy = vi.mocked(User.findById);
      const findByIdCalls = findByIdSpy.mock.calls;
      void expect(findByIdCalls.length).toBe(1);
      void expect(findByIdCalls[0]?.[0]).toBe(userId);
      void expect(mockUser.generateEmailVerificationToken).toHaveBeenCalled();
      void expect(mockUser.save).toHaveBeenCalled();
      void expect(queueEmail).toHaveBeenCalledWith('emailVerification', {
        user: mockUser,
        verificationToken: 'new-token',
      });
    });

    it('should throw error if user not found', async () => {
      vi.spyOn(User, 'findById').mockResolvedValue(null);

      await expect(authService.resendVerificationEmail('invalid-id')).rejects.toThrow(
        new AppError('User not found', 404),
      );
    });

    it('should throw error if email already verified', async () => {
      const mockUser = createMockUser({
        emailVerified: true,
      });

      vi.spyOn(User, 'findById').mockResolvedValue(mockUser as IUserDocument);

      await expect(authService.resendVerificationEmail('user-123')).rejects.toThrow(
        new AppError('Email is already verified', 400),
      );
    });

    it('should enforce rate limiting', async () => {
      const userId = 'user-123';
      const mockUser = createMockUser({
        emailVerified: false,
      });

      vi.spyOn(User, 'findById').mockResolvedValue(mockUser as IUserDocument);
      mockRedis.incr.mockResolvedValue(4); // Over the limit

      await expect(authService.resendVerificationEmail(userId)).rejects.toThrow(
        new AppError('Too many verification email requests. Please try again later.', 429),
      );

      void expect(mockUser.generateEmailVerificationToken).not.toHaveBeenCalled();
    });

    it('should set rate limit expiry on first request', async () => {
      const userId = 'user-123';
      const mockUser = createMockUser({
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      mockUser.generateEmailVerificationToken.mockReturnValue('token');

      vi.spyOn(User, 'findById').mockResolvedValue(mockUser as IUserDocument);
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      vi.mocked(queueEmail).mockResolvedValue(undefined);

      await authService.resendVerificationEmail(userId);

      void expect(mockRedis.expire).toHaveBeenCalledWith(`email-verification-resend:${userId}`, 3600);
    });

    it('should handle email queue failure', async () => {
      const userId = 'user-123';
      const mockUser = createMockUser({
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      mockUser.generateEmailVerificationToken.mockReturnValue('token');

      vi.spyOn(User, 'findById').mockResolvedValue(mockUser as IUserDocument);
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      vi.mocked(queueEmail).mockRejectedValue(new Error('Queue error'));

      await expect(authService.resendVerificationEmail(userId)).rejects.toThrow(
        new AppError('Failed to send verification email', 500),
      );
    });
  });

  describe('signup', () => {
    it('should create unverified user and send verification email', async () => {
      const signupInput = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
      };

      const mockUser = createMockUser({
        name: signupInput.name,
        email: signupInput.email,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      vi.spyOn(User, 'findOne').mockResolvedValue(null);
      // Mongoose's create method has overloaded signatures - when called with a single object,
      // it returns a single document, but TypeScript types expect array return
      const createSpy = vi.spyOn(User, 'create').mockImplementation(async () => {
        return mockUser as unknown as ReturnType<typeof User.create>;
      });
      vi.mocked(queueEmail).mockResolvedValue(undefined);

      type AuthServiceWithPrivateMethods = typeof authService & {
        generateTokens: (userId: string) => { accessToken: string; refreshToken: string };
        storeRefreshToken: (userId: string, token: string) => Promise<void>;
      };
      
      const authServicePrivate = authService as unknown as AuthServiceWithPrivateMethods;
      
      const generateTokensSpy = vi.spyOn(authServicePrivate, 'generateTokens').mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      const storeRefreshTokenSpy = vi.spyOn(authServicePrivate, 'storeRefreshToken').mockResolvedValue(undefined);

      const result = await authService.signup(signupInput);

      void expect(vi.mocked(User.findOne)).toHaveBeenCalledWith({ email: signupInput.email });
      void expect(createSpy).toHaveBeenCalledWith({
        name: signupInput.name,
        email: signupInput.email,
        password: signupInput.password,
        emailVerified: false,
      });

      void expect(mockUser.generateEmailVerificationToken).toHaveBeenCalled();
      void expect(mockUser.save).toHaveBeenCalled();

      void expect(queueEmail).toHaveBeenCalledWith('emailVerification', {
        user: mockUser,
        verificationToken: 'verification-token',
      });

      void expect(result.user.emailVerified).toBe(false);

      generateTokensSpy.mockRestore();
      storeRefreshTokenSpy.mockRestore();
    });
  });
});