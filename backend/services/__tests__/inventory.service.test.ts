import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { InventoryService } from '../inventory.service.js';
import { Product } from '../../models/product.model.js';
import { InventoryHistory } from '../../models/inventory-history.model.js';
import { CacheService } from '../cache.service.js';
import { StockStatus } from '../../../shared/types/inventory.types.js';
import { AppError } from '../../utils/AppError.js';

vi.mock('../../models/product.model.js');
vi.mock('../../models/inventory-history.model.js');
vi.mock('../cache.service.js');
vi.mock('../../lib/websocket.js', () => ({
  websocketService: {
    publishInventoryUpdate: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('InventoryService', () => {
  let inventoryService: InventoryService;

  beforeEach(() => {
    inventoryService = new InventoryService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('checkAvailability', () => {
    it('should return true when sufficient inventory is available', async () => {
      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        variants: [
          { variantId: 'v1', inventory: 10 },
          { variantId: 'v2', inventory: 5 }
        ]
      };
      vi.spyOn(Product, 'findById').mockResolvedValue(mockProduct);

      const result = await inventoryService.checkAvailability('507f1f77bcf86cd799439011', 'v1', 5);
      expect(result).toBe(true);
    });

    it('should return false when insufficient inventory', async () => {
      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        variants: [
          { variantId: 'v1', inventory: 3 },
          { variantId: 'v2', inventory: 5 }
        ]
      };
      vi.spyOn(Product, 'findById').mockResolvedValue(mockProduct);

      const result = await inventoryService.checkAvailability('507f1f77bcf86cd799439011', 'v1', 5);
      expect(result).toBe(false);
    });

    it('should return false when product not found', async () => {
      vi.spyOn(Product, 'findById').mockResolvedValue(null);

      const result = await inventoryService.checkAvailability('507f1f77bcf86cd799439011', 'v1', 3);
      expect(result).toBe(false);
    });

    it('should sum all variant inventories when no variantId specified', async () => {
      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        variants: [
          { variantId: 'v1', inventory: 10 },
          { variantId: 'v2', inventory: 5 }
        ]
      };
      vi.spyOn(Product, 'findById').mockResolvedValue(mockProduct);

      const result = await inventoryService.checkAvailability('507f1f77bcf86cd799439011', undefined, 12);
      expect(result).toBe(true);

      const result2 = await inventoryService.checkAvailability('507f1f77bcf86cd799439011', undefined, 20);
      expect(result2).toBe(false);
    });
  });

  describe('getAvailableInventory', () => {
    it('should return variant inventory', async () => {
      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        variants: [
          { variantId: 'v1', inventory: 10 },
          { variantId: 'v2', inventory: 5 }
        ]
      };
      vi.spyOn(Product, 'findById').mockResolvedValue(mockProduct);

      const result = await inventoryService.getAvailableInventory('507f1f77bcf86cd799439011', 'v1');
      expect(result).toBe(10);
    });

    it('should return total inventory when no variant specified', async () => {
      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        variants: [
          { variantId: 'v1', inventory: 10 },
          { variantId: 'v2', inventory: 5 }
        ]
      };
      vi.spyOn(Product, 'findById').mockResolvedValue(mockProduct);

      const result = await inventoryService.getAvailableInventory('507f1f77bcf86cd799439011');
      expect(result).toBe(15);
    });

    it('should throw error when product not found', async () => {
      vi.spyOn(Product, 'findById').mockResolvedValue(null);

      await expect(inventoryService.getAvailableInventory('507f1f77bcf86cd799439011')).rejects.toThrow(AppError);
    });

    it('should return 0 for products without variants', async () => {
      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        variants: []
      };
      vi.spyOn(Product, 'findById').mockResolvedValue(mockProduct);

      const result = await inventoryService.getAvailableInventory('507f1f77bcf86cd799439011');
      expect(result).toBe(0);
    });
  });

  describe('updateInventory', () => {
    it('should update inventory successfully', async () => {
      const mockProduct = {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        variants: [{ variantId: 'v1', inventory: 10 }],
        lowStockThreshold: 5,
        allowBackorder: false,
      };

      const updatedProduct = {
        ...mockProduct,
        variants: [{ variantId: 'v1', inventory: 20 }],
      };

      vi.spyOn(Product, 'findById').mockResolvedValue(mockProduct);
      vi.spyOn(Product, 'findOneAndUpdate').mockResolvedValue(updatedProduct);
      vi.spyOn(InventoryHistory.prototype, 'save').mockResolvedValue({});

      const result = await inventoryService.updateInventory(
        '507f1f77bcf86cd799439011',
        'v1',
        10,
        'restock',
        'user123',
        { supplier: 'Test Supplier' }
      );

      expect(result.success).toBe(true);
      expect(result.previousQuantity).toBe(10);
      expect(result.newQuantity).toBe(20);
      expect(result.availableStock).toBe(20);
    });

    it('should prevent negative inventory', async () => {
      const mockProduct = {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        variants: [{ variantId: 'v1', inventory: 5 }],
      };

      vi.spyOn(Product, 'findById').mockResolvedValue(mockProduct);
      vi.spyOn(Product, 'findOneAndUpdate').mockResolvedValue(null);

      await expect(
        inventoryService.updateInventory(
          '507f1f77bcf86cd799439011',
          'v1',
          -10,
          'sale',
          'user123'
        )
      ).rejects.toThrow(AppError);
    });

    it('should validate sale quantity against available inventory', async () => {
      const mockProduct = {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        variants: [{ variantId: 'v1', inventory: 5 }],
      };

      vi.spyOn(Product, 'findById').mockResolvedValue(mockProduct);
      // Mock getAvailableInventory to return 5
      vi.spyOn(inventoryService, 'getAvailableInventory').mockResolvedValue(5);

      await expect(
        inventoryService.updateInventory(
          '507f1f77bcf86cd799439011',
          'v1',
          -10,
          'sale',
          'user123'
        )
      ).rejects.toThrow('Cannot sell 10 items. Only 5 available');
    });
  });

  describe('getProductInventoryInfo', () => {
    it('should return inventory info for a product', async () => {
      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        variants: [
          { variantId: 'v1', inventory: 10 },
          { variantId: 'v2', inventory: 5 }
        ],
        lowStockThreshold: 5,
        allowBackorder: false,
        restockDate: new Date('2024-12-31'),
      };

      vi.spyOn(Product, 'findById').mockResolvedValue(mockProduct);

      const result = await inventoryService.getProductInventoryInfo('507f1f77bcf86cd799439011', 'v1');

      expect(result).toEqual({
        productId: '507f1f77bcf86cd799439011',
        variantId: 'v1',
        currentStock: 10,
        availableStock: 10,
        lowStockThreshold: 5,
        allowBackorder: false,
        restockDate: mockProduct.restockDate,
        stockStatus: StockStatus.IN_STOCK,
      });
    });

    it('should calculate correct stock status', async () => {
      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        variants: [{ variantId: 'v1', inventory: 3 }],
        lowStockThreshold: 5,
        allowBackorder: false,
      };

      vi.spyOn(Product, 'findById').mockResolvedValue(mockProduct);

      const result = await inventoryService.getProductInventoryInfo('507f1f77bcf86cd799439011', 'v1');

      expect(result.stockStatus).toBe(StockStatus.LOW_STOCK);
    });

    it('should return out of stock status when inventory is 0', async () => {
      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        variants: [{ variantId: 'v1', inventory: 0 }],
        lowStockThreshold: 5,
        allowBackorder: false,
      };

      vi.spyOn(Product, 'findById').mockResolvedValue(mockProduct);

      const result = await inventoryService.getProductInventoryInfo('507f1f77bcf86cd799439011', 'v1');

      expect(result.stockStatus).toBe(StockStatus.OUT_OF_STOCK);
    });

    it('should return backordered status when allowBackorder is true', async () => {
      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        variants: [{ variantId: 'v1', inventory: 0 }],
        lowStockThreshold: 5,
        allowBackorder: true,
      };

      vi.spyOn(Product, 'findById').mockResolvedValue(mockProduct);

      const result = await inventoryService.getProductInventoryInfo('507f1f77bcf86cd799439011', 'v1');

      expect(result.stockStatus).toBe(StockStatus.BACKORDERED);
    });
  });

  describe('getInventoryMetrics', () => {
    it('should return inventory metrics from aggregation', async () => {
      const mockMetrics = {
        totalProducts: 100,
        totalValue: 50000,
        outOfStockCount: 5,
        lowStockCount: 10,
      };

      vi.spyOn(Product, 'aggregate').mockResolvedValue([mockMetrics]);
      const mockCacheGet = vi.fn().mockResolvedValue(null);
      const mockCacheSet = vi.fn().mockResolvedValue(undefined);
      vi.mocked(CacheService).mockImplementation(() => ({
        get: mockCacheGet,
        set: mockCacheSet,
        del: vi.fn(),
        flush: vi.fn(),
      } as any));

      const result = await inventoryService.getInventoryMetrics();

      expect(result).toEqual(mockMetrics);
    });
  });
});