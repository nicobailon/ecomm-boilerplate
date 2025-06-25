import { TRPCError } from '@trpc/server';
import { redis, isRedisHealthy } from '../../lib/redis.js';
import { withRedisHealth } from '../../lib/redis-health.js';
import { defaultLogger as logger } from '../../utils/logger.js';
import { middleware } from '../index.js';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  prefix: string;
}

// In-memory fallback for rate limiting
const memoryStore = new Map<string, { count: number; resetAt: number }>();

export const createRateLimiter = (options: RateLimitOptions): ReturnType<typeof middleware> => {
  // Cleanup expired entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of memoryStore.entries()) {
      if (value.resetAt <= now) {
        memoryStore.delete(key);
      }
    }
  }, 60000); // Clean up every minute

  return middleware(async ({ ctx, next }) => {
    const userId = 'userId' in ctx ? (ctx.userId as string) : ctx.user?._id?.toString();
    const key = `${options.prefix}${userId ?? ctx.req?.ip ?? 'unknown'}`;
    const windowInSeconds = Math.floor(options.windowMs / 1000);
    
    // Skip rate limiting if Redis is unhealthy
    if (!isRedisHealthy()) {
      logger.warn('[tRPC RateLimiter] Bypassing rate limit - Redis unhealthy');
      
      // Use in-memory fallback for critical endpoints
      const now = Date.now();
      const memoryKey = key;
      const entry = memoryStore.get(memoryKey);
      
      if (!entry || entry.resetAt <= now) {
        memoryStore.set(memoryKey, {
          count: 1,
          resetAt: now + options.windowMs,
        });
      } else {
        entry.count++;
        if (entry.count > options.max) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many requests, please try again later.',
          });
        }
      }
      
      return next();
    }
    
    try {
      const result = await withRedisHealth(
        async () => {
          const current = await redis.incr(key);
          
          if (current === 1) {
            await redis.expire(key, windowInSeconds);
          }
          
          return current;
        },
        undefined,
        'tRPC rate limit check',
      );
      
      // If Redis operation failed, allow the request
      if (result === null) {
        logger.warn('[tRPC RateLimiter] Redis operation failed, allowing request');
        return next();
      }
      
      if (result > options.max) {
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
      
      logger.error('[tRPC RateLimiter] Unexpected error:', error);
      // Allow request on unexpected errors
      return next();
    }
  });
};