import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../index.js';
import { authService } from '../../services/auth.service.js';
import { TRPCError } from '@trpc/server';
import { signupSchema, loginSchema } from '../../validations/index.js';

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
      } catch (error: any) {
        throw new TRPCError({
          code: error.statusCode === 400 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to sign up',
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
      } catch (error: any) {
        throw new TRPCError({
          code: error.statusCode === 400 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to login',
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
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to logout',
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
      } catch (error: any) {
        throw new TRPCError({
          code: error.statusCode === 401 ? 'UNAUTHORIZED' : 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to refresh token',
        });
      }
    }),

  profile: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const user = await authService.getProfile(ctx.user._id as string);
        return user;
      } catch (error: any) {
        throw new TRPCError({
          code: error.statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to get profile',
        });
      }
    }),
});