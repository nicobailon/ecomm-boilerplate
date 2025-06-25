import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CacheService } from '../cache.service.js';
import { redis } from '../../lib/redis.js';

vi.mock('../../lib/redis.js');

describe('CacheService', () => {
  let cacheService: CacheService;
  let mockRedis: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    del: ReturnType<typeof vi.fn>;
    flushall: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    cacheService = new CacheService();
    mockRedis = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      flushall: vi.fn(),
    };
    Object.assign(redis, mockRedis);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('should get value from cache when it exists', async () => {
      const testData = { id: 1, name: 'Test Product' };
      mockRedis.get.mockResolvedValue(JSON.stringify(testData));

      const result = await cacheService.get<typeof testData>('test-key');

      void expect(result).toEqual(testData);
      void expect(mockRedis.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null when key does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await cacheService.get('non-existent-key');

      void expect(result).toBeNull();
      void expect(mockRedis.get).toHaveBeenCalledWith('non-existent-key');
    });

    it('should handle JSON parse errors gracefully', async () => {
      mockRedis.get.mockResolvedValue('invalid-json');
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {
        // Mock implementation to suppress console output during tests
      });

      const result = await cacheService.get('test-key');

      void expect(result).toBeNull();
      void expect(consoleError).toHaveBeenCalled();
      
      consoleError.mockRestore();
    });

    it('should handle Redis errors gracefully', async () => {
      void mockRedis.get.mockRejectedValue(new Error('Redis connection error'));
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {
        // Mock implementation to suppress console output during tests
      });

      const result = await cacheService.get('test-key');

      void expect(result).toBeNull();
      void expect(consoleError).toHaveBeenCalledWith(
        'Cache get error:',
        expect.any(Error),
      );
      
      consoleError.mockRestore();
    });
  });

  describe('set', () => {
    it('should set value in cache with TTL', async () => {
      const testData = { id: 1, name: 'Test Product' };
      mockRedis.set.mockResolvedValue('OK');

      await cacheService.set('test-key', testData, 300);

      void expect(mockRedis.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(testData),
        'EX',
        300,
      );
    });

    it('should set value in cache with default TTL', async () => {
      const testData = { id: 1, name: 'Test Product' };
      mockRedis.set.mockResolvedValue('OK');

      await cacheService.set('test-key', testData);

      void expect(mockRedis.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(testData),
        'EX',
        3600,
      );
    });

    it('should handle set errors gracefully', async () => {
      void mockRedis.set.mockRejectedValue(new Error('Redis connection error'));
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {
        // Mock implementation to suppress console output during tests
      });

      await cacheService.set('test-key', { data: 'test' }, 300);

      void expect(consoleError).toHaveBeenCalledWith(
        'Cache set error:',
        expect.any(Error),
      );
      
      consoleError.mockRestore();
    });
  });

  describe('del', () => {
    it('should delete single key from cache', async () => {
      mockRedis.del.mockResolvedValue(1);

      await cacheService.del('test-key');

      void expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    });

    it('should delete single key from cache only', async () => {
      mockRedis.del.mockResolvedValue(1);

      await cacheService.del('test-key');

      void expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    });

    it('should handle delete errors gracefully', async () => {
      void mockRedis.del.mockRejectedValue(new Error('Redis connection error'));
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {
        // Mock implementation to suppress console output during tests
      });

      await cacheService.del('test-key');

      void expect(consoleError).toHaveBeenCalledWith(
        'Cache delete error:',
        expect.any(Error),
      );
      
      consoleError.mockRestore();
    });
  });

  describe('flush', () => {
    it('should flush all cache', async () => {
      mockRedis.flushall.mockResolvedValue('OK');

      await cacheService.flush();

      void expect(mockRedis.flushall).toHaveBeenCalled();
    });

    it('should handle flush errors gracefully', async () => {
      void mockRedis.flushall.mockRejectedValue(new Error('Redis connection error'));
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {
        // Mock implementation to suppress console output during tests
      });

      await cacheService.flush();

      void expect(consoleError).toHaveBeenCalledWith(
        'Cache flush error:',
        expect.any(Error),
      );
      
      consoleError.mockRestore();
    });
  });

  describe('complex caching scenarios', () => {
    it('should handle caching product inventory info', async () => {
      const inventoryInfo = {
        productId: '507f1f77bcf86cd799439011',
        variantId: 'v1',
        currentStock: 50,
        availableStock: 40,
      };
      const cacheKey = 'inventory:product:507f1f77bcf86cd799439011:v1';

      mockRedis.set.mockResolvedValue('OK');
      
      await cacheService.set(cacheKey, inventoryInfo, 30);

      void expect(mockRedis.set).toHaveBeenCalledWith(
        cacheKey,
        JSON.stringify(inventoryInfo),
        'EX',
        30,
      );
    });

    it('should handle multiple cache operations', async () => {
      // Test setting multiple values
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.del.mockResolvedValue(1);

      await cacheService.set('key1', { data: 'value1' }, 60);
      await cacheService.set('key2', { data: 'value2' }, 60);
      await cacheService.del('key1');

      void expect(mockRedis.set).toHaveBeenCalledTimes(2);
      void expect(mockRedis.del).toHaveBeenCalledWith('key1');
    });
  });
});