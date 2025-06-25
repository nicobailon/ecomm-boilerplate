import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { inventoryService } from '../inventory.service.js';
import { Product } from '../../models/product.model.js';
import * as featureFlags from '../../utils/featureFlags.js';
import { CacheService } from '../cache.service.js';
import { mockObjectId } from '../../test/helpers/mongoose-mocks.js';

vi.mock('../../models/product.model');
vi.mock('../cache.service');

describe('InventoryService - Dual Mode Behavior', () => {
  const mockProductId = mockObjectId('507f1f77bcf86cd799439011');
  
  const mockProduct = {
    _id: mockProductId,
    name: 'Test Product',
    variants: [
      {
        variantId: 'var-small',
        label: 'Small - Blue',
        size: 'S',
        color: '#0000FF',
        inventory: 10,
        price: 29.99,
      },
      {
        variantId: 'var-medium',
        label: 'Medium - Blue',
        size: 'M',
        color: '#0000FF',
        inventory: 15,
        price: 29.99,
      },
    ],
  };

  const mockCacheService = {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
    flush: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(CacheService).mockImplementation(() => mockCacheService as unknown as CacheService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkAvailability', () => {
    describe('with USE_VARIANT_LABEL = true', () => {
      beforeEach(() => {
        vi.spyOn(featureFlags, 'USE_VARIANT_LABEL', 'get').mockReturnValue(true);
      });

      it('should check availability using label', async () => {
        const mockAggregateResult = [{ availableStock: 8 }];
        const mockAggregate = vi.spyOn(Product, 'aggregate');
        mockAggregate.mockResolvedValue(mockAggregateResult);

        const result = await inventoryService.checkAvailability(
          mockProductId.toString(),
          undefined,
          5,
          'Small - Blue',
        );

        void expect(result).toBe(true);
        
        const mockAggregate2 = vi.spyOn(Product, 'aggregate');
        const aggregateCall = mockAggregate2.mock.calls[0];
        const pipeline = aggregateCall[0] as unknown;
        
        void expect(pipeline).toContainEqual({ $match: { 'variants.label': 'Small - Blue' } });
      });

      it('should fallback to variantId if label not provided', async () => {
        const mockAggregateResult = [{ availableStock: 10 }];
        const mockAggregate3 = vi.spyOn(Product, 'aggregate');
        mockAggregate3.mockResolvedValue(mockAggregateResult);

        const result = await inventoryService.checkAvailability(
          mockProductId.toString(),
          'var-medium',
          5,
        );

        void expect(result).toBe(true);
        
        const mockAggregate4 = vi.spyOn(Product, 'aggregate');
        const aggregateCall = mockAggregate4.mock.calls[0];
        const pipeline = aggregateCall[0] as unknown;
        
        void expect(pipeline).toContainEqual({ $match: { 'variants.variantId': 'var-medium' } });
      });
    });

    describe('with USE_VARIANT_LABEL = false', () => {
      beforeEach(() => {
        vi.spyOn(featureFlags, 'USE_VARIANT_LABEL', 'get').mockReturnValue(false);
      });

      it('should ignore label and use variantId', async () => {
        const mockAggregateResult = [{ availableStock: 12 }];
        const mockAggregate5 = vi.spyOn(Product, 'aggregate');
        mockAggregate5.mockResolvedValue(mockAggregateResult);

        const result = await inventoryService.checkAvailability(
          mockProductId.toString(),
          'var-small',
          5,
          'Medium - Blue',
        );

        void expect(result).toBe(true);
        
        const mockAggregate6 = vi.spyOn(Product, 'aggregate');
        const aggregateCall = mockAggregate6.mock.calls[0];
        const pipeline = aggregateCall[0] as unknown;
        
        void expect(pipeline).toContainEqual({ $match: { 'variants.variantId': 'var-small' } });
        void expect(pipeline).not.toContainEqual({ $match: { 'variants.label': 'Medium - Blue' } });
      });
    });
  });

  // Reservation tests removed - this codebase follows a Shopify-like pattern with no inventory reservations

  describe('getProductInventoryInfo', () => {
    describe('with USE_VARIANT_LABEL = true', () => {
      beforeEach(() => {
        vi.spyOn(featureFlags, 'USE_VARIANT_LABEL', 'get').mockReturnValue(true);
      });

      it('should use label-based cache key', async () => {
        mockCacheService.get.mockResolvedValue(null);
        const mockFindById = vi.spyOn(Product, 'findById');
        mockFindById.mockResolvedValue(mockProduct);
        // No reservations in this system

        await inventoryService.getProductInventoryInfo(
          mockProductId.toString(),
          undefined,
          'Medium - Blue',
        );

        const getCalls = mockCacheService.get.mock.calls;
        const hasLabelKey = getCalls.some((call: unknown[]) => 
          typeof call[0] === 'string' && call[0].includes(':label:Medium - Blue'),
        );
        void expect(hasLabelKey).toBe(true);
      });

      it('should set cache with label-based key', async () => {
        mockCacheService.get.mockResolvedValue(null);
        const mockFindById = vi.spyOn(Product, 'findById');
        mockFindById.mockResolvedValue(mockProduct);
        // No reservations in this system

        await inventoryService.getProductInventoryInfo(
          mockProductId.toString(),
          undefined,
          'Small - Blue',
        );

        const setCalls = mockCacheService.set.mock.calls;
        const hasLabelKey = setCalls.some((call: unknown[]) => 
          typeof call[0] === 'string' && call[0].includes(':label:Small - Blue'),
        );
        void expect(hasLabelKey).toBe(true);
      });
    });

    describe('with USE_VARIANT_LABEL = false', () => {
      beforeEach(() => {
        vi.spyOn(featureFlags, 'USE_VARIANT_LABEL', 'get').mockReturnValue(false);
      });

      it('should use variantId-based cache key (legacy)', async () => {
        mockCacheService.get.mockResolvedValue(null);
        const mockFindById = vi.spyOn(Product, 'findById');
        mockFindById.mockResolvedValue(mockProduct);
        // No reservations in this system

        await inventoryService.getProductInventoryInfo(
          mockProductId.toString(),
          'var-small',
        );

        const getCalls = mockCacheService.get.mock.calls;
        const hasLegacyKey = getCalls.some((call: unknown[]) => 
          typeof call[0] === 'string' && call[0].includes(':var-small') && !call[0].includes(':label:'),
        );
        void expect(hasLegacyKey).toBe(true);
      });
    });
  });
});