import { TRPCError } from '@trpc/server';
import { redis } from '../../lib/redis.js';
import { middleware } from '../index.js';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  prefix: string;
}

export const createRateLimiter = (options: RateLimitOptions): ReturnType<typeof middleware> => {
  return middleware(async ({ ctx, next }) => {
    const userId = 'userId' in ctx ? (ctx.userId as string) : ctx.user?._id?.toString();
    const key = `${options.prefix}${userId ?? ctx.req?.ip ?? 'unknown'}`;
    const windowInSeconds = Math.floor(options.windowMs / 1000);
    
    try {
      const current = await redis.incr(key);
      
      if (current === 1) {
        await redis.expire(key, windowInSeconds);
      }
      
      if (current > options.max) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many requests, please try again later.',
        });
      }
      
      return next();
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      console.error('Rate limiter error:', error);
      return next();
    }
  });
};