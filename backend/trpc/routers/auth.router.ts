import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../index.js';
import { authService } from '../../services/auth.service.js';
import { TRPCError } from '@trpc/server';
import { signupSchema, loginSchema } from '../../validations/index.js';
import { isAppError } from '../../utils/error-types.js';

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
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
        const refreshToken = ctx.req.cookies.refreshToken as string | undefined;
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
});