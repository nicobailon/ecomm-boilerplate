import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../index.js';
import { authService } from '../../services/auth.service.js';
import { TRPCError } from '@trpc/server';
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema } from '../../validations/index.js';
import { isAppError } from '../../utils/error-types.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Rate limiters for password reset
const passwordResetRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per 15 minutes
  prefix: 'rl:password-reset:',
});

const resetPasswordRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  prefix: 'rl:reset-password:',
});

const resendVerificationRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  prefix: 'rl:resend-verification:',
});

export const authRouter = router({
  signup: publicProcedure
    .input(signupSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await authService.signup({
          name: input.name,
          email: input.email,
          password: input.password,
        });
        
        // Set cookies
        ctx.res.cookie('accessToken', result.tokens.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000, // 15 minutes
        });

        ctx.res.cookie('refreshToken', result.tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return {
          user: result.user,
        };
      } catch (error) {
        if (isAppError(error) && error.statusCode === 400) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }
        const message = error instanceof Error ? error.message : 'Failed to sign up';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to sign up',
        });
      }
    }),

  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await authService.login({
          email: input.email,
          password: input.password,
        });
        
        // Set cookies
        ctx.res.cookie('accessToken', result.tokens.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000, // 15 minutes
        });

        ctx.res.cookie('refreshToken', result.tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return {
          user: result.user,
        };
      } catch (error) {
        if (isAppError(error) && error.statusCode === 400) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }
        const message = error instanceof Error ? error.message : 'Failed to login';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to login',
        });
      }
    }),

  logout: publicProcedure
    .mutation(async ({ ctx }) => {
      try {
        const refreshToken = ctx.req.cookies.refreshToken;
        await authService.logout(refreshToken);
        
        // Clear cookies
        ctx.res.clearCookie('accessToken');
        ctx.res.clearCookie('refreshToken');
        
        return { success: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to logout';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to logout',
        });
      }
    }),

  refresh: publicProcedure
    .input(refreshTokenSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const accessToken = await authService.refreshAccessToken(input.refreshToken);
        
        // Set new access token cookie
        ctx.res.cookie('accessToken', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000, // 15 minutes
        });

        return { accessToken };
      } catch (error) {
        if (isAppError(error) && error.statusCode === 401) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: error.message,
          });
        }
        const message = error instanceof Error ? error.message : 'Failed to refresh token';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to refresh token',
        });
      }
    }),

  profile: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        if (!ctx.user?._id) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          });
        }
        const user = await authService.getProfile(ctx.user._id.toString());
        return user;
      } catch (error) {
        if (isAppError(error) && error.statusCode === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }
        const message = error instanceof Error ? error.message : 'Failed to get profile';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to get profile',
        });
      }
    }),

  forgotPassword: publicProcedure
    .use(passwordResetRateLimit)
    .input(forgotPasswordSchema)
    .mutation(async ({ input }) => {
      try {
        await authService.forgotPassword(input.email);
        return {
          message: 'If an account exists with this email, a password reset link has been sent.',
        };
      } catch (error) {
        if (isAppError(error)) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process password reset request',
        });
      }
    }),

  resetPassword: publicProcedure
    .use(resetPasswordRateLimit)
    .input(resetPasswordSchema)
    .mutation(async ({ input }) => {
      try {
        await authService.resetPassword(input.token, input.password);
        return {
          message: 'Password has been reset successfully',
        };
      } catch (error) {
        if (isAppError(error) && error.statusCode === 400) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to reset password',
        });
      }
    }),

  verifyEmail: publicProcedure
    .input(verifyEmailSchema)
    .mutation(async ({ input }) => {
      try {
        const user = await authService.verifyEmail(input.token);
        return {
          success: true,
          user,
          message: 'Email verified successfully',
        };
      } catch (error) {
        if (isAppError(error) && error.statusCode === 400) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to verify email',
        });
      }
    }),

  resendVerification: protectedProcedure
    .use(resendVerificationRateLimit)
    .mutation(async ({ ctx }) => {
      try {
        await authService.resendVerificationEmail(ctx.user._id.toString());
        return {
          success: true,
          message: 'Verification email sent successfully',
        };
      } catch (error) {
        if (isAppError(error)) {
          if (error.statusCode === 400) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: error.message,
            });
          }
          if (error.statusCode === 429) {
            throw new TRPCError({
              code: 'TOO_MANY_REQUESTS',
              message: error.message,
            });
          }
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to resend verification email',
        });
      }
    }),
});