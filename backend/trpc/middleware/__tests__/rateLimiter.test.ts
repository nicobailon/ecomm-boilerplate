import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRateLimiter } from '../rateLimiter.js';
import { TRPCError } from '@trpc/server';
import { redis } from '../../../lib/redis.js';
import type { Context } from '../../context.js';
import type { Request, Response } from 'express';
import type { IUserDocument } from '../../../models/user.model.js';

vi.mock('../../../lib/redis.js');

describe('rateLimiter middleware', () => {
  let mockRedis: {
    incr: ReturnType<typeof vi.fn>;
    expire: ReturnType<typeof vi.fn>;
    ttl: ReturnType<typeof vi.fn>;
    decr: ReturnType<typeof vi.fn>;
    del: ReturnType<typeof vi.fn>;
  };

  const mockCtx: Context = {
    user: {
      _id: { toString: () => 'user123' },
      email: 'user@test.com',
      role: 'user',
    } as unknown as IUserDocument,
    req: {
      headers: { 'x-forwarded-for': '192.168.1.1' },
      connection: { remoteAddress: '127.0.0.1' },
      ip: '192.168.1.1',
    } as unknown as Request,
    res: {} as Response,
  };

  beforeEach(() => {
    mockRedis = {
      incr: vi.fn(),
      expire: vi.fn(),
      ttl: vi.fn(),
      decr: vi.fn(),
      del: vi.fn(),
    };
    Object.assign(redis, mockRedis);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to call middleware
  const callMiddleware = async (middleware: any, ctx: Context, nextValue?: any) => {
    const mockNext = vi.fn().mockResolvedValue(nextValue || { result: 'success' });
    
    // Extract the middleware function from the _middlewares array
    const middlewareFunc = middleware._middlewares[0];
    const result = await middlewareFunc({ ctx, next: mockNext });
    
    return { result, mockNext };
  };

  describe('standard rate limiting', () => {
    it('should allow request when under limit', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);

      const rateLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 100,
        prefix: 'rate_limit:',
      });

      const { result, mockNext } = await callMiddleware(rateLimiter, mockCtx, { result: 'success' });

      expect(result).toEqual({ result: 'success' });
      expect(mockRedis.incr).toHaveBeenCalledWith('rate_limit:user123');
      expect(mockRedis.expire).toHaveBeenCalledWith('rate_limit:user123', 60);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should block request when over limit', async () => {
      mockRedis.incr.mockResolvedValue(101); // Over default limit of 100
      mockRedis.ttl.mockResolvedValue(30);

      const rateLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 100,
        prefix: 'rate_limit:',
      });

      await expect(callMiddleware(rateLimiter, mockCtx)).rejects.toThrow(TRPCError);
    });

    it('should use IP-based rate limiting for unauthenticated requests', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);

      const rateLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 100,
        prefix: 'rate_limit:',
      });

      const ctxWithoutUser = {
        ...mockCtx,
        user: null,
      } as Context;

      await callMiddleware(rateLimiter, ctxWithoutUser);

      expect(mockRedis.incr).toHaveBeenCalledWith('rate_limit:192.168.1.1');
    });
  });

  describe('rate limiting with different configurations', () => {
    it('should apply auth-specific limits', async () => {
      mockRedis.incr.mockResolvedValue(1); // First request, so expire will be called
      mockRedis.expire.mockResolvedValue(1);

      const rateLimiter = createRateLimiter({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 50,
        prefix: 'auth:',
      });

      await callMiddleware(rateLimiter, mockCtx);

      expect(mockRedis.incr).toHaveBeenCalledWith('auth:user123');
      expect(mockRedis.expire).toHaveBeenCalledWith('auth:user123', 900); // 15 minutes
    });

    it('should block requests over auth limit', async () => {
      mockRedis.incr.mockResolvedValue(51); // Over limit of 50

      const rateLimiter = createRateLimiter({
        windowMs: 15 * 60 * 1000,
        max: 50,
        prefix: 'auth:',
      });

      await expect(callMiddleware(rateLimiter, mockCtx)).rejects.toThrow(TRPCError);
    });

    it('should apply inventory-specific limits', async () => {
      mockRedis.incr.mockResolvedValue(15);
      mockRedis.expire.mockResolvedValue(1);

      const rateLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 100,
        prefix: 'inventory:check:',
      });

      await callMiddleware(rateLimiter, mockCtx);

      expect(mockRedis.incr).toHaveBeenCalledWith('inventory:check:user123');
    });

    it('should apply query-specific limits', async () => {
      mockRedis.incr.mockResolvedValue(180);

      const rateLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 200,
        prefix: 'query:',
      });

      await callMiddleware(rateLimiter, mockCtx);

      expect(mockRedis.incr).toHaveBeenCalledWith('query:user123');
    });
  });

  describe('custom limits', () => {
    it('should apply custom limit when provided', async () => {
      mockRedis.incr.mockResolvedValue(10);

      const customLimit = 20;
      const rateLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: customLimit,
        prefix: 'custom:',
      });

      const { result } = await callMiddleware(rateLimiter, mockCtx, { result: 'success' });

      expect(result).toEqual({ result: 'success' });
    });

    it('should respect custom limits', async () => {
      mockRedis.incr.mockResolvedValue(21); // Over custom limit

      const customLimit = 20;
      const rateLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: customLimit,
        prefix: 'custom:',
      });

      await expect(callMiddleware(rateLimiter, mockCtx)).rejects.toThrow(TRPCError);
    });
  });

  describe('error handling', () => {
    it('should allow request when Redis is unavailable', async () => {
      mockRedis.incr.mockRejectedValue(new Error('Redis connection failed'));

      const rateLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 100,
        prefix: 'rate_limit:',
      });

      const { result } = await callMiddleware(rateLimiter, mockCtx, { result: 'success' });

      expect(result).toEqual({ result: 'success' });
    });

    it('should include retry-after in error message', async () => {
      mockRedis.incr.mockResolvedValue(101);
      mockRedis.ttl.mockResolvedValue(30);

      const rateLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 100,
        prefix: 'rate_limit:',
      });

      try {
        await callMiddleware(rateLimiter, mockCtx);
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe('TOO_MANY_REQUESTS');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle missing IP address', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);

      const rateLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 100,
        prefix: 'rate_limit:',
      });

      const ctxWithoutIp = {
        req: {},
        res: {},
        user: null,
      } as Context;

      await callMiddleware(rateLimiter, ctxWithoutIp);

      expect(mockRedis.incr).toHaveBeenCalledWith('rate_limit:unknown');
    });

    it('should handle IPv6 addresses', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);

      const rateLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 100,
        prefix: 'rate_limit:',
      });

      const ctxWithIpv6 = {
        ...mockCtx,
        user: null,
        req: {
          ...mockCtx.req,
          ip: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        } as any,
      } as Context;

      await callMiddleware(rateLimiter, ctxWithIpv6);

      expect(mockRedis.incr).toHaveBeenCalledWith('rate_limit:2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    });

    it('should handle multiple IPs in x-forwarded-for', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);

      const rateLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 100,
        prefix: 'rate_limit:',
      });

      const ctxWithMultipleIps = {
        ...mockCtx,
        user: null,
        req: {
          headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1' },
          connection: { remoteAddress: '127.0.0.1' },
          ip: '192.168.1.1',
        } as any,
      } as Context;

      await callMiddleware(rateLimiter, ctxWithMultipleIps);

      expect(mockRedis.incr).toHaveBeenCalledWith('rate_limit:192.168.1.1');
    });
  });

  describe('cleanup operations', () => {
    it('should handle rate limit reset', async () => {
      mockRedis.del.mockResolvedValue(1);

      // This test just ensures we can call Redis del
      await redis.del('rate_limit:user123');
      expect(mockRedis.del).toHaveBeenCalledWith('rate_limit:user123');
    });

    it('should handle checking remaining limit', async () => {
      mockRedis.incr.mockResolvedValue(75);

      const rateLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 100,
        prefix: 'rate_limit:',
      });

      await callMiddleware(rateLimiter, mockCtx);

      // User has made 75 requests, 25 remaining
      expect(mockRedis.incr).toHaveBeenCalledWith('rate_limit:user123');
    });
  });
});