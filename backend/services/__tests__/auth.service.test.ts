import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../auth.service.js';
import { User } from '../../models/user.model.js';
import { redis } from '../../lib/redis.js';
import { queueEmail } from '../../lib/email-queue.js';
import { AppError } from '../../utils/AppError.js';
import crypto from 'crypto';

vi.mock('../../models/user.model.js');
vi.mock('../../lib/redis.js');
vi.mock('../../lib/email-queue.js');

describe('AuthService', () => {
  const mockRedis = {
    incr: vi.fn(),
    expire: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(redis, mockRedis);
  });

  describe('verifyEmail', () => {
    it('should verify user email with valid token', async () => {
      const token = 'valid-token';
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      const mockUser = {
        _id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'customer',
        emailVerified: false,
        emailVerificationToken: hashedToken,
        emailVerificationExpires: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
        save: vi.fn(),
      };

      vi.spyOn(User, 'findOne').mockResolvedValue(mockUser as any);
      vi.mocked(queueEmail).mockResolvedValue({ id: 'job-123' } as any);

      const result = await authService.verifyEmail(token);

      void expect(User.findOne).toHaveBeenCalledWith({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: expect.any(Number) },
      });

      void expect(mockUser.emailVerified).toBe(true);
      void expect(mockUser.emailVerificationToken).toBeUndefined();
      void expect(mockUser.emailVerificationExpires).toBeUndefined();
      void expect(mockUser.save).toHaveBeenCalled();

      void expect(queueEmail).toHaveBeenCalledWith('welcomeEmail', { user: mockUser });

      void expect(result).toEqual({
        _id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'customer',
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
      
      const mockUser = {
        _id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'customer',
        emailVerified: false,
        emailVerificationToken: hashedToken,
        emailVerificationExpires: new Date(Date.now() + 1000 * 60 * 60),
        save: vi.fn(),
      };

      const findOneSpy = vi.spyOn(User, 'findOne').mockResolvedValue(mockUser as any);
      vi.mocked(queueEmail).mockRejectedValue(new Error('Queue error'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

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
      const mockUser = {
        _id: userId,
        email: 'test@example.com',
        emailVerified: false,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        generateEmailVerificationToken: vi.fn().mockReturnValue('new-token'),
        save: vi.fn(),
      };

      vi.spyOn(User, 'findById').mockResolvedValue(mockUser as any);
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      vi.mocked(queueEmail).mockResolvedValue({ id: 'job-123' } as any);

      await authService.resendVerificationEmail(userId);

      void expect(User.findById).toHaveBeenCalledWith(userId);
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
      const mockUser = {
        emailVerified: true,
      };

      vi.spyOn(User, 'findById').mockResolvedValue(mockUser as any);

      await expect(authService.resendVerificationEmail('user-123')).rejects.toThrow(
        new AppError('Email is already verified', 400),
      );
    });

    it('should enforce rate limiting', async () => {
      const userId = 'user-123';
      const mockUser = {
        _id: userId,
        emailVerified: false,
        generateEmailVerificationToken: vi.fn(),
        save: vi.fn(),
      };

      vi.spyOn(User, 'findById').mockResolvedValue(mockUser as any);
      mockRedis.incr.mockResolvedValue(4); // Over the limit

      await expect(authService.resendVerificationEmail(userId)).rejects.toThrow(
        new AppError('Too many verification email requests. Please try again later.', 429),
      );

      void expect(mockUser.generateEmailVerificationToken).not.toHaveBeenCalled();
    });

    it('should set rate limit expiry on first request', async () => {
      const userId = 'user-123';
      const mockUser = {
        _id: userId,
        email: 'test@example.com',
        emailVerified: false,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        generateEmailVerificationToken: vi.fn().mockReturnValue('token'),
        save: vi.fn(),
      };

      vi.spyOn(User, 'findById').mockResolvedValue(mockUser as any);
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      vi.mocked(queueEmail).mockResolvedValue({ id: 'job-123' } as any);

      await authService.resendVerificationEmail(userId);

      void expect(mockRedis.expire).toHaveBeenCalledWith(`email-verification-resend:${userId}`, 3600);
    });

    it('should handle email queue failure', async () => {
      const userId = 'user-123';
      const mockUser = {
        _id: userId,
        email: 'test@example.com',
        emailVerified: false,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        generateEmailVerificationToken: vi.fn().mockReturnValue('token'),
        save: vi.fn(),
      };

      vi.spyOn(User, 'findById').mockResolvedValue(mockUser as any);
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

      const mockUser = {
        _id: 'user-123',
        name: signupInput.name,
        email: signupInput.email,
        role: 'customer',
        emailVerified: false,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        generateEmailVerificationToken: vi.fn().mockReturnValue('verification-token'),
        save: vi.fn(),
      };

      vi.spyOn(User, 'findOne').mockResolvedValue(null);
      const createSpy = vi.spyOn(User, 'create').mockResolvedValue(mockUser as any);
      vi.mocked(queueEmail).mockResolvedValue({ id: 'job-123' } as any);

      const generateTokensSpy = vi.spyOn(authService as any, 'generateTokens').mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      const storeRefreshTokenSpy = vi.spyOn(authService as any, 'storeRefreshToken').mockResolvedValue(undefined);

      const result = await authService.signup(signupInput);

      void expect(User.findOne).toHaveBeenCalledWith({ email: signupInput.email });
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