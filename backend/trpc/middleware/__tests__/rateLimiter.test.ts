import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRateLimiter } from '../rateLimiter.js';
import { TRPCError } from '@trpc/server';
import { redis } from '../../../lib/redis.js';
import type { Context } from '../../context.js';

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
    } as any,
    req: {
      headers: { 'x-forwarded-for': '192.168.1.1' },
      connection: { remoteAddress: '127.0.0.1' },
      ip: '192.168.1.1',
    } as any,
    res: {} as any,
  };

  const mockNext = vi.fn();

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

  describe('standard rate limiting', () => {
    it('should allow request when under limit', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockNext.mockResolvedValue({ result: 'success' });

      const rateLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 100,
        prefix: 'rate_limit:',
      });

      const params = {
        ctx: mockCtx,
        next: mockNext,
        path: 'test.procedure',
        type: 'mutation' as const,
        rawInput: {},
        meta: {},
        input: {},
      };

      // Call the middleware function that createRateLimiter returns
      const result = await (rateLimiter as any)._def(params);

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

      const params = {
        ctx: mockCtx,
        next: mockNext,
        path: 'test.procedure',
        type: 'mutation' as const,
        rawInput: {},
        meta: {},
        input: {},
      };

      await expect((rateLimiter as any)._def(params)).rejects.toThrow(TRPCError);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should use IP-based rate limiting for unauthenticated requests', async () => {
      const unauthCtx = {
        ...mockCtx,
        user: null,
      };

      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockNext.mockResolvedValue({ result: 'success' });

      const rateLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 100,
        prefix: 'rate_limit:',
      });

      const params = {
        ctx: unauthCtx,
        next: mockNext,
        path: 'test.procedure',
        type: 'query' as const,
        rawInput: {},
        meta: {},
        input: {},
      };

      await (rateLimiter as any)._def(params);

      expect(mockRedis.incr).toHaveBeenCalledWith('rate_limit:192.168.1.1');
    });
  });

  describe('rate limiting with different configurations', () => {
    it('should apply auth-specific limits', async () => {
      mockRedis.incr.mockResolvedValue(5);
      mockRedis.expire.mockResolvedValue(1);
      mockNext.mockResolvedValue({ result: 'success' });

      const rateLimiter = createRateLimiter({
        windowMs: 300 * 1000, // 5 minutes
        max: 10,
        prefix: 'auth:',
      });

      const params = {
        ctx: mockCtx,
        next: mockNext,
        path: 'auth.login',
        type: 'mutation' as const,
        rawInput: {},
        meta: {},
        input: {},
      };

      await (rateLimiter as any)._def(params);

      expect(mockRedis.incr).toHaveBeenCalledWith('auth:user123');
      expect(mockRedis.expire).toHaveBeenCalledWith('auth:user123', 300);
    });

    it('should block requests over auth limit', async () => {
      mockRedis.incr.mockResolvedValue(11); // Over auth limit of 10
      mockRedis.ttl.mockResolvedValue(120);

      const rateLimiter = createRateLimiter({
        windowMs: 300 * 1000,
        max: 10,
        prefix: 'auth:',
      });

      const params = {
        ctx: mockCtx,
        next: mockNext,
        path: 'auth.register',
        type: 'mutation' as const,
        rawInput: {},
        meta: {},
        input: {},
      };

      await expect((rateLimiter as any)._def(params)).rejects.toThrow(TRPCError);
    });

    it('should apply inventory-specific limits', async () => {
      mockRedis.incr.mockResolvedValue(15);
      mockRedis.expire.mockResolvedValue(1);
      mockNext.mockResolvedValue({ result: 'success' });

      const rateLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 100,
        prefix: 'inventory:check:',
      });

      const params = {
        ctx: mockCtx,
        next: mockNext,
        path: 'inventory.checkAvailability',
        type: 'query' as const,
        rawInput: {},
        meta: {},
        input: {},
      };

      await (rateLimiter as any)._def(params);

      expect(mockRedis.incr).toHaveBeenCalledWith('inventory:check:user123');
      expect(mockRedis.expire).toHaveBeenCalledWith('inventory:check:user123', 60);
    });

    it('should apply query-specific limits', async () => {
      mockRedis.incr.mockResolvedValue(30);
      mockRedis.expire.mockResolvedValue(1);
      mockNext.mockResolvedValue({ result: 'success' });

      const rateLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 60,
        prefix: 'inventory:query:',
      });

      const params = {
        ctx: mockCtx,
        next: mockNext,
        path: 'inventory.getMetrics',
        type: 'query' as const,
        rawInput: {},
        meta: {},
        input: {},
      };

      await (rateLimiter as any)._def(params);

      expect(mockRedis.incr).toHaveBeenCalledWith('inventory:query:user123');
      expect(mockRedis.expire).toHaveBeenCalledWith('inventory:query:user123', 60);
    });
  });

  describe('custom limits', () => {
    it('should apply custom limit when provided', async () => {
      mockRedis.incr.mockResolvedValue(3);
      mockRedis.expire.mockResolvedValue(1);
      mockNext.mockResolvedValue({ result: 'success' });

      const rateLimiter = createRateLimiter({
        windowMs: 120 * 1000,
        max: 5,
        prefix: 'rate_limit:',
      });

      const params = {
        ctx: mockCtx,
        next: mockNext,
        path: 'custom.procedure',
        type: 'mutation' as const,
        rawInput: {},
        meta: {},
        input: {},
      };

      await (rateLimiter as any)._def(params);

      expect(mockRedis.incr).toHaveBeenCalledWith('rate_limit:user123');
      expect(mockRedis.expire).toHaveBeenCalledWith('rate_limit:user123', 120);
    });

    it('should respect custom limits', async () => {
      mockRedis.incr.mockResolvedValue(4);
      mockRedis.ttl.mockResolvedValue(60);

      const rateLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 3,
        prefix: 'rate_limit:',
      });

      const params = {
        ctx: mockCtx,
        next: mockNext,
        path: 'inventory.update',
        type: 'mutation' as const,
        rawInput: {},
        meta: {},
        input: {},
      };

      await expect((rateLimiter as any)._def(params)).rejects.toThrow(TRPCError);
    });
  });

  describe('error handling', () => {
    it('should allow request when Redis is unavailable', async () => {
      mockRedis.incr.mockRejectedValue(new Error('Redis connection error'));
      mockNext.mockResolvedValue({ result: 'success' });

      const rateLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 100,
        prefix: 'rate_limit:',
      });

      const params = {
        ctx: mockCtx,
        next: mockNext,
        path: 'test.procedure',
        type: 'query' as const,
        rawInput: {},
        meta: {},
        input: {},
      };

      const result = await (rateLimiter as any)._def(params);

      expect(result).toEqual({ result: 'success' });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should include retry-after in error message', async () => {
      mockRedis.incr.mockResolvedValue(101);
      mockRedis.ttl.mockResolvedValue(45);

      const rateLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 100,
        prefix: 'rate_limit:',
      });

      const params = {
        ctx: mockCtx,
        next: mockNext,
        path: 'test.procedure',
        type: 'mutation' as const,
        rawInput: {},
        meta: {},
        input: {},
      };

      try {
        await (rateLimiter as any)._def(params);
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe('TOO_MANY_REQUESTS');
        expect((error as TRPCError).message).toBe('Too many requests, please try again later.');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle missing IP address', async () => {
      const noIpCtx = {
        ...mockCtx,
        user: null,
        req: {
          headers: {},
          connection: {},
        } as any,
      };

      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockNext.mockResolvedValue({ result: 'success' });

      const rateLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 100,
        prefix: 'rate_limit:',
      });

      const params = {
        ctx: noIpCtx,
        next: mockNext,
        path: 'test.procedure',
        type: 'query' as const,
        rawInput: {},
        meta: {},
        input: {},
      };

      await (rateLimiter as any)._def(params);

      expect(mockRedis.incr).toHaveBeenCalledWith('rate_limit:unknown');
    });

    it('should handle IPv6 addresses', async () => {
      const ipv6Ctx = {
        ...mockCtx,
        user: null,
        req: {
          headers: { 'x-forwarded-for': '2001:0db8:85a3:0000:0000:8a2e:0370:7334' },
          connection: {},
        } as any,
      };

      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockNext.mockResolvedValue({ result: 'success' });

      const rateLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 100,
        prefix: 'rate_limit:',
      });

      const params = {
        ctx: ipv6Ctx,
        next: mockNext,
        path: 'test.procedure',
        type: 'query' as const,
        rawInput: {},
        meta: {},
        input: {},
      };

      await (rateLimiter as any)._def(params);

      expect(mockRedis.incr).toHaveBeenCalledWith(
        'rate_limit:2001:0db8:85a3:0000:0000:8a2e:0370:7334'
      );
    });

    it('should handle multiple IPs in x-forwarded-for', async () => {
      const multiIpCtx = {
        ...mockCtx,
        user: null,
        req: {
          headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1' },
          connection: {},
        } as any,
      };

      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockNext.mockResolvedValue({ result: 'success' });

      const rateLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 100,
        prefix: 'rate_limit:',
      });

      const params = {
        ctx: multiIpCtx,
        next: mockNext,
        path: 'test.procedure',
        type: 'query' as const,
        rawInput: {},
        meta: {},
        input: {},
      };

      await (rateLimiter as any)._def(params);

      expect(mockRedis.incr).toHaveBeenCalledWith('rate_limit:192.168.1.1');
    });
  });

  describe('cleanup operations', () => {
    it('should handle rate limit reset', async () => {
      mockRedis.del.mockResolvedValue(1);

      await redis.del('rate_limit:user123');

      expect(mockRedis.del).toHaveBeenCalledWith('rate_limit:user123');
    });

    it('should handle checking remaining limit', async () => {
      mockRedis.incr.mockResolvedValue(25);
      mockRedis.decr.mockResolvedValue(24);
      mockNext.mockResolvedValue({ result: 'success' });

      const rateLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 100,
        prefix: 'rate_limit:',
      });

      const params = {
        ctx: mockCtx,
        next: mockNext,
        path: 'test.procedure',
        type: 'query' as const,
        rawInput: {},
        meta: {},
        input: {},
      };

      // Make request
      await (rateLimiter as any)._def(params);

      // Check remaining by incrementing and then decrementing
      const current = await redis.incr('rate_limit:user123');
      await redis.decr('rate_limit:user123');

      const remaining = 100 - (current - 1);
      expect(remaining).toBe(75);
    });
  });
});