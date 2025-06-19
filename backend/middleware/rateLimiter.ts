import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../lib/redis.js';
import { Request } from 'express';

declare module 'express' {
  interface Request {
    userId?: string;
  }
}

const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
}): RateLimitRequestHandler => {
  const baseOptions = {
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

  if (redis) {
    return rateLimit({
      ...baseOptions,
      store: new RedisStore({
        // @ts-expect-error - RedisStore types are outdated, sendCommand property exists at runtime
        sendCommand: (...args: string[]) => redis.call(...args),
        prefix: 'rl:',
      }),
    });
  }

  return rateLimit(baseOptions);
};

export const couponValidationLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many coupon validation attempts, please try again later.',
  skipSuccessfulRequests: true,
});

export const couponApplicationLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many coupon application attempts, please try again later.',
});

export const strictCouponLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: 'Daily coupon operation limit exceeded.',
});

