import rateLimit, { RateLimitRequestHandler, Options } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis, isRedisHealthy } from '../lib/redis.js';
import { defaultLogger as logger } from '../utils/logger.js';
import { Request, Response, NextFunction } from 'express';

declare module 'express' {
  interface Request {
    userId?: string;
  }
}

// Store for rate limiter instances
let rateLimiterCache = new Map<string, RateLimitRequestHandler>();

const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  key?: string; // Cache key for this limiter
}): RateLimitRequestHandler => {
  // Return a wrapper middleware that creates the limiter on first request
  const middleware = ((req: Request, res: Response, next: NextFunction) => {
    const cacheKey = options.key || `${options.windowMs}-${options.max}`;
    
    // Check if we already have a limiter for this configuration
    let limiter = rateLimiterCache.get(cacheKey);
    
    if (!limiter) {
      const baseOptions: Partial<Options> = {
        windowMs: options.windowMs,
        max: options.max,
        message: options.message ?? 'Too many requests, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: options.keyGenerator ?? ((req: Request) => {
          return req.userId ?? req.ip ?? 'anonymous';
        }),
        skipSuccessfulRequests: options.skipSuccessfulRequests ?? false,
      };

      // Check Redis health before using Redis store
      if (redis && isRedisHealthy()) {
        try {
          limiter = rateLimit({
            ...baseOptions,
            store: new RedisStore({
              // @ts-expect-error - RedisStore types are outdated, sendCommand property exists at runtime
              sendCommand: async (...args: string[]) => {
                try {
                  // Check Redis health again before sending command
                  if (!isRedisHealthy()) {
                    throw new Error('Redis is unhealthy');
                  }
                  // Use a more specific approach for the Redis command
                  const [command, ...commandArgs] = args;
                  return await redis.call(command, ...commandArgs);
                } catch (error) {
                  // Log error but don't fail - fallback will be used
                  logger.error('[RateLimiter] Redis command failed:', error);
                  throw error; // Let express-rate-limit handle the fallback
                }
              },
              prefix: 'rl:',
            }),
            // Add skip function to bypass when Redis is down
            skip: (_req, _res) => {
              if (!isRedisHealthy()) {
                logger.warn('[RateLimiter] Bypassing rate limit check - Redis unhealthy');
                return true;
              }
              return false;
            },
          });
        } catch (error) {
          logger.error('[RateLimiter] Failed to create Redis store, using memory store:', error);
          // Fall through to memory store
          limiter = rateLimit(baseOptions);
        }
      } else {
        logger.warn('[RateLimiter] Using memory store - Redis not ready');
        limiter = rateLimit(baseOptions);
      }
      
      // Cache the limiter
      rateLimiterCache.set(cacheKey, limiter);
    }
    
    return limiter(req, res, next);
  }) as RateLimitRequestHandler;
  
  return middleware;
};

export const couponValidationLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many coupon validation attempts, please try again later.',
  skipSuccessfulRequests: true,
  key: 'coupon-validation',
});

export const couponApplicationLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many coupon application attempts, please try again later.',
  key: 'coupon-application',
});

export const strictCouponLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: 'Daily coupon operation limit exceeded.',
  key: 'coupon-strict',
});

export const rateLimiter = (max: number, windowMinutes = 15): RateLimitRequestHandler => createRateLimiter({
  windowMs: windowMinutes * 60 * 1000,
  max,
  key: `generic-${max}-${windowMinutes}`,
});

