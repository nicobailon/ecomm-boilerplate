import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { authRouter } from '../auth.router.js';
import { authService } from '../../../services/auth.service.js';
import { createTestContext } from '../../../test/helpers/test-context.js';
import { TRPCError } from '@trpc/server';
import { AppError } from '../../../utils/AppError.js';

vi.mock('../../../services/auth.service.js');
vi.mock('../../../lib/redis.js', () => ({
  redis: {
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
  },
}));

describe('authRouter', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('forgotPassword', () => {
    it('should handle password reset request successfully', async () => {
      vi.mocked(authService.forgotPassword).mockResolvedValue(undefined);

      const ctx = createTestContext();
      const caller = authRouter.createCaller(() => ctx);
      const result = await caller.forgotPassword({ email: 'test@example.com' });

      void expect(authService.forgotPassword).toHaveBeenCalledWith('test@example.com');
      void expect(result).toEqual({
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(authService.forgotPassword).mockRejectedValue(
        new AppError('Email service error', 500),
      );

      const ctx = createTestContext();
      const caller = authRouter.createCaller(() => ctx);
      
      await expect(caller.forgotPassword({ email: 'test@example.com' }))
        .rejects.toThrow(TRPCError);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      vi.mocked(authService.resetPassword).mockResolvedValue(undefined);

      const ctx = createTestContext();
      const caller = authRouter.createCaller(() => ctx);
      const result = await caller.resetPassword({
        token: 'valid-token',
        password: 'newPassword123',
      });

      void expect(authService.resetPassword).toHaveBeenCalledWith('valid-token', 'newPassword123');
      void expect(result).toEqual({
        message: 'Password has been reset successfully',
      });
    });

    it('should handle invalid token error', async () => {
      vi.mocked(authService.resetPassword).mockRejectedValue(
        new AppError('Invalid or expired reset token', 400),
      );

      const ctx = createTestContext();
      const caller = authRouter.createCaller(() => ctx);
      
      await expect(caller.resetPassword({
        token: 'invalid-token',
        password: 'newPassword123',
      })).rejects.toThrow(TRPCError);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const mockUser = {
        _id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'customer',
        emailVerified: true,
      };

      vi.mocked(authService.verifyEmail).mockResolvedValue(mockUser);

      const ctx = createTestContext();
      const caller = authRouter.createCaller(() => ctx);
      const result = await caller.verifyEmail({ token: 'valid-token' });

      void expect(authService.verifyEmail).toHaveBeenCalledWith('valid-token');
      void expect(result).toEqual({
        success: true,
        user: mockUser,
        message: 'Email verified successfully',
      });
    });

    it('should handle invalid verification token', async () => {
      vi.mocked(authService.verifyEmail).mockRejectedValue(
        new AppError('Invalid or expired verification token', 400),
      );

      const ctx = createTestContext();
      const caller = authRouter.createCaller(() => ctx);
      
      await expect(caller.verifyEmail({ token: 'invalid-token' }))
        .rejects.toThrow(TRPCError);
    });
  });

  describe('resendVerification', () => {
    it('should resend verification email for authenticated user', async () => {
      vi.mocked(authService.resendVerificationEmail).mockResolvedValue(undefined);

      const mockUser = {
        _id: { toString: () => 'user-123' },
        name: 'Test User',
        email: 'test@example.com',
        role: 'customer' as const,
      };

      const ctx = createTestContext({ user: mockUser as any });
      const caller = authRouter.createCaller(() => ctx);
      const result = await caller.resendVerification();

      void expect(authService.resendVerificationEmail).toHaveBeenCalledWith('user-123');
      void expect(result).toEqual({
        success: true,
        message: 'Verification email sent successfully',
      });
    });

    it('should throw error for unauthenticated user', async () => {
      const ctx = createTestContext();
      const caller = authRouter.createCaller(() => ctx);
      
      await expect(caller.resendVerification())
        .rejects.toThrow(TRPCError);
    });

    it('should handle rate limit errors', async () => {
      vi.mocked(authService.resendVerificationEmail).mockRejectedValue(
        new AppError('Too many verification email requests. Please try again later.', 429),
      );

      const mockUser = {
        _id: { toString: () => 'user-123' },
        name: 'Test User',
        email: 'test@example.com',
        role: 'customer' as const,
      };

      const ctx = createTestContext({ user: mockUser as any });
      const caller = authRouter.createCaller(() => ctx);
      
      await expect(caller.resendVerification())
        .rejects.toThrow(TRPCError);
    });

    it('should handle already verified email error', async () => {
      vi.mocked(authService.resendVerificationEmail).mockRejectedValue(
        new AppError('Email is already verified', 400),
      );

      const mockUser = {
        _id: { toString: () => 'user-123' },
        name: 'Test User',
        email: 'test@example.com',
        role: 'customer' as const,
      };

      const ctx = createTestContext({ user: mockUser as any });
      const caller = authRouter.createCaller(() => ctx);
      
      await expect(caller.resendVerification())
        .rejects.toThrow(TRPCError);
    });
  });

  describe('signup flow with email verification', () => {
    it('should create unverified user and trigger verification email', async () => {
      const signupInput = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
      };

      const mockResult = {
        user: {
          _id: 'user-123',
          name: signupInput.name,
          email: signupInput.email,
          role: 'customer',
          emailVerified: false,
        },
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      };

      vi.mocked(authService.signup).mockResolvedValue(mockResult);

      const ctx = createTestContext();
      const caller = authRouter.createCaller(() => ctx);
      const result = await caller.signup(signupInput);

      void expect(authService.signup).toHaveBeenCalledWith(signupInput);
      void expect(result.user.emailVerified).toBe(false);
    });
  });
});