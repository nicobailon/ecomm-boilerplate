import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MediaCacheService } from '../mediaCache.service.js';
import { RedisHealthService } from '../../lib/redis-health.js';
import { redis } from '../../lib/redis.js';
import { IMediaItem } from '../../types/media.types.js';

vi.mock('../../lib/redis.js', () => ({
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    keys: vi.fn(),
  },
}));

vi.mock('../../utils/logger.js', () => ({
  defaultLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('MediaCacheService with Redis Health Wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    RedisHealthService.reset();
  });

  afterEach(() => {
    RedisHealthService.reset();
  });

  describe('getCachedMedia', () => {
    it('should return cached media when Redis is healthy', async () => {
      const mockMedia: IMediaItem[] = [
        {
          id: 'media1',
          type: 'image',
          url: 'https://example.com/image.jpg',
          order: 0,
          createdAt: new Date('2025-06-28T19:57:42.707Z'),
        },
      ];
      
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(mockMedia));
      
      const result = await MediaCacheService.getCachedMedia('product123');
      
      expect(result).toEqual([
        {
          id: 'media1',
          type: 'image',
          url: 'https://example.com/image.jpg',
          order: 0,
          createdAt: '2025-06-28T19:57:42.707Z',
        },
      ]);
      expect(redis.get).toHaveBeenCalledWith('media:product123');
    });

    it('should return null when Redis is unhealthy', async () => {
      RedisHealthService.markUnhealthy('Test error');
      
      const result = await MediaCacheService.getCachedMedia('product123');
      
      expect(result).toBeNull();
      expect(redis.get).not.toHaveBeenCalled();
    });

    it('should handle Redis errors gracefully', async () => {
      vi.mocked(redis.get).mockRejectedValue(new Error('ECONNRESET'));
      
      const result = await MediaCacheService.getCachedMedia('product123');
      
      expect(result).toBeNull();
      expect(RedisHealthService.isRedisHealthy()).toBe(false);
    });
  });

  describe('setCachedMedia', () => {
    it('should set cache when Redis is healthy', async () => {
      const mockMedia: IMediaItem[] = [
        {
          id: 'media1',
          type: 'image',
          url: 'https://example.com/image.jpg',
          order: 0,
          createdAt: new Date(),
        },
      ];
      
      vi.mocked(redis.setex).mockResolvedValue('OK');
      
      await MediaCacheService.setCachedMedia('product123', mockMedia);
      
      expect(redis.setex).toHaveBeenCalledWith(
        'media:product123',
        3600,
        JSON.stringify(mockMedia),
      );
    });

    it('should skip setting cache when Redis is unhealthy', async () => {
      RedisHealthService.markUnhealthy('Test error');
      
      const mockMedia: IMediaItem[] = [];
      await MediaCacheService.setCachedMedia('product123', mockMedia);
      
      expect(redis.setex).not.toHaveBeenCalled();
    });
  });

  describe('invalidateMediaCache', () => {
    it('should delete cache when Redis is healthy', async () => {
      vi.mocked(redis.del).mockResolvedValue(1);
      
      await MediaCacheService.invalidateMediaCache('product123');
      
      expect(redis.del).toHaveBeenCalledWith('media:product123');
    });

    it('should skip deletion when Redis is unhealthy', async () => {
      RedisHealthService.markUnhealthy('Test error');
      
      await MediaCacheService.invalidateMediaCache('product123');
      
      expect(redis.del).not.toHaveBeenCalled();
    });
  });

  describe('invalidateAllMediaCache', () => {
    it('should delete all cache keys when Redis is healthy', async () => {
      const mockKeys = ['media:product1', 'media:product2', 'media:product3'];
      vi.mocked(redis.keys).mockResolvedValue(mockKeys);
      vi.mocked(redis.del).mockResolvedValue(3);
      
      await MediaCacheService.invalidateAllMediaCache();
      
      expect(redis.keys).toHaveBeenCalledWith('media:*');
      expect(redis.del).toHaveBeenCalledWith(...mockKeys);
    });

    it('should handle empty keys array', async () => {
      vi.mocked(redis.keys).mockResolvedValue([]);
      
      await MediaCacheService.invalidateAllMediaCache();
      
      expect(redis.keys).toHaveBeenCalledWith('media:*');
      expect(redis.del).not.toHaveBeenCalled();
    });

    it('should skip deletion when Redis is unhealthy', async () => {
      RedisHealthService.markUnhealthy('Test error');
      
      await MediaCacheService.invalidateAllMediaCache();
      
      expect(redis.keys).not.toHaveBeenCalled();
      expect(redis.del).not.toHaveBeenCalled();
    });
  });

  describe('Redis health recovery', () => {
    it('should mark Redis as healthy after successful operation', async () => {
      RedisHealthService.markUnhealthy('Previous error');
      expect(RedisHealthService.isRedisHealthy()).toBe(false);
      
      // Wait for cooldown to end
      await new Promise(resolve => setTimeout(resolve, 100));
      RedisHealthService.markHealthy();
      
      vi.mocked(redis.get).mockResolvedValue(null);
      
      const result = await MediaCacheService.getCachedMedia('product123');
      
      expect(result).toBeNull();
      expect(redis.get).toHaveBeenCalled();
      expect(RedisHealthService.isRedisHealthy()).toBe(true);
    });
  });
});