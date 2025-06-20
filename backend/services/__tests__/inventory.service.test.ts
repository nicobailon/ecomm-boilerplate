import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { InventoryService } from '../inventory.service.js';
import { Product } from '../../models/product.model.js';
import { InventoryReservation } from '../../models/inventory-reservation.model.js';
import { InventoryHistory } from '../../models/inventory-history.model.js';
import { CacheService } from '../cache.service.js';
import { StockStatus } from '../../../shared/types/inventory.types.js';

vi.mock('../../models/product.model.js');
vi.mock('../../models/inventory-reservation.model.js');
vi.mock('../../models/inventory-history.model.js');
vi.mock('../cache.service.js');

describe('InventoryService', () => {
  let inventoryService: InventoryService;
  let mockSession: mongoose.ClientSession;

  beforeEach(() => {
    inventoryService = new InventoryService();
    mockSession = {
      startTransaction: vi.fn(),
      commitTransaction: vi.fn(),
      abortTransaction: vi.fn(),
      endSession: vi.fn(),
      id: 'test-session-id'
    } as unknown as mongoose.ClientSession;
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('checkAvailability', () => {
    it('should return true when sufficient inventory is available', async () => {
      vi.spyOn(Product, 'aggregate').mockResolvedValue([
        { availableStock: 8 }
      ]);

      const result = await inventoryService.checkAvailability('507f1f77bcf86cd799439011', 'v1', 5);
      expect(result).toBe(true);
    });

    it('should return false when insufficient inventory', async () => {
      vi.spyOn(Product, 'aggregate').mockResolvedValue([
        { availableStock: 3 }
      ]);

      const result = await inventoryService.checkAvailability('507f1f77bcf86cd799439011', 'v1', 5);
      expect(result).toBe(false);
    });

    it('should consider reserved inventory', async () => {
      vi.spyOn(Product, 'aggregate').mockResolvedValue([
        { availableStock: 2 }
      ]);

      const result = await inventoryService.checkAvailability('507f1f77bcf86cd799439011', 'v1', 3);
      expect(result).toBe(false);
    });
  });

  describe('reserveInventory', () => {
    it('should create a new reservation when inventory is available', async () => {
      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        variants: [{ variantId: 'v1', inventory: 10 }],
      };

      vi.spyOn(Product, 'findById').mockReturnValue({
        session: vi.fn().mockResolvedValue(mockProduct),
      } as unknown as ReturnType<typeof Product.findById>);

      vi.spyOn(InventoryReservation, 'aggregate').mockReturnValue({
        session: vi.fn().mockResolvedValue([{ totalReserved: 2 }]),
      } as unknown as ReturnType<typeof InventoryReservation.aggregate>);

      vi.spyOn(InventoryReservation, 'findOne').mockReturnValue({
        session: vi.fn().mockResolvedValue(null),
      } as unknown as ReturnType<typeof InventoryReservation.findOne>);

      const mockReservationId = new mongoose.Types.ObjectId();
      
      // Mock the constructor to add _id to the instance
      vi.spyOn(InventoryReservation.prototype, 'save').mockImplementation(function(this: InstanceType<typeof InventoryReservation>) {
        // Add _id to the instance
        Object.defineProperty(this, '_id', {
          value: mockReservationId,
          writable: true,
          enumerable: true,
          configurable: true
        });
        return Promise.resolve(this);
      });

      const result = await inventoryService.reserveInventory(
        '507f1f77bcf86cd799439011',
        'v1',
        5,
        'session123',
        30 * 60 * 1000,
        'user123'
      );

      expect(result.success).toBe(true);
      expect(result.reservationId).toBe(mockReservationId.toString());
      expect(result.availableStock).toBe(3);
      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });

    it('should update existing reservation for same session', async () => {
      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        variants: [{ variantId: 'v1', inventory: 10 }],
      };

      vi.spyOn(Product, 'findById').mockReturnValue({
        session: vi.fn().mockResolvedValue(mockProduct),
      } as unknown as ReturnType<typeof Product.findById>);

      vi.spyOn(InventoryReservation, 'aggregate').mockReturnValue({
        session: vi.fn().mockResolvedValue([{ totalReserved: 2 }]),
      } as unknown as ReturnType<typeof InventoryReservation.aggregate>);

      const existingReservation = {
        _id: new mongoose.Types.ObjectId(),
        quantity: 3,
        expiresAt: new Date(),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(InventoryReservation, 'findOne').mockReturnValue({
        session: vi.fn().mockResolvedValue(existingReservation),
      } as unknown as ReturnType<typeof InventoryReservation.findOne>);

      const result = await inventoryService.reserveInventory(
        '507f1f77bcf86cd799439011',
        'v1',
        5,
        'session123'
      );

      expect(result.success).toBe(true);
      expect(existingReservation.quantity).toBe(5);
      expect(existingReservation.save).toHaveBeenCalled();
    });

    it('should fail when insufficient inventory', async () => {
      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        variants: [{ variantId: 'v1', inventory: 10 }],
      };

      vi.spyOn(Product, 'findById').mockReturnValue({
        session: vi.fn().mockResolvedValue(mockProduct),
      } as unknown as ReturnType<typeof Product.findById>);

      vi.spyOn(InventoryReservation, 'aggregate').mockReturnValue({
        session: vi.fn().mockResolvedValue([{ totalReserved: 8 }]),
      } as unknown as ReturnType<typeof InventoryReservation.aggregate>);

      const result = await inventoryService.reserveInventory(
        '507f1f77bcf86cd799439011',
        'v1',
        5,
        'session123'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Only 2 items available');
      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });
  });

  describe('updateInventory', () => {
    it('should update inventory with positive adjustment', async () => {
      const updatedProduct = {
        _id: '507f1f77bcf86cd799439011',
        variants: [{ variantId: 'v1', inventory: 15 }],
      };

      vi.spyOn(Product, 'findOneAndUpdate').mockResolvedValue(updatedProduct as unknown as ReturnType<typeof Product.findOneAndUpdate>);

      vi.spyOn(InventoryHistory.prototype, 'save').mockResolvedValue({
        toObject: () => ({ id: 'history123' }),
      } as unknown as InstanceType<typeof InventoryHistory>);

      vi.spyOn(inventoryService, 'getAvailableInventory').mockResolvedValue(15);
      vi.spyOn(CacheService.prototype, 'del').mockResolvedValue();

      const result = await inventoryService.updateInventory(
        '507f1f77bcf86cd799439011',
        'v1',
        5,
        'restock',
        'user123'
      );

      expect(result.success).toBe(true);
      expect(result.previousQuantity).toBe(10);
      expect(result.newQuantity).toBe(15);
    });

    it('should fail when trying to reduce inventory below zero', async () => {
      vi.spyOn(Product, 'findOneAndUpdate').mockResolvedValue(null);
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

    it('should enforce business rules for adjustment reasons', async () => {
      vi.spyOn(inventoryService, 'getAvailableInventory').mockResolvedValue(5);

      await expect(
        inventoryService.updateInventory(
          '507f1f77bcf86cd799439011',
          'v1',
          -8,
          'sale',
          'user123'
        )
      ).rejects.toThrow('Cannot sell 8 items. Only 5 available');
    });
  });

  describe('getLowStockProducts', () => {
    it('should return products below threshold', async () => {
      const mockAlerts = [
        {
          productId: '507f1f77bcf86cd799439011',
          productName: 'Product 1',
          variantId: 'v1',
          variantName: 'Size M',
          currentStock: 3,
          threshold: 5,
          lastRestocked: new Date(),
        },
      ];

      const mockCacheService = vi.mocked(CacheService.prototype);
      mockCacheService.get.mockResolvedValue(null);
      mockCacheService.set.mockResolvedValue();

      vi.spyOn(Product, 'aggregate').mockResolvedValue(mockAlerts);

      const result = await inventoryService.getLowStockProducts(5);

      expect(result).toEqual(mockAlerts);
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should return cached results when available', async () => {
      const cachedAlerts = [
        { productId: '507f1f77bcf86cd799439011', productName: 'Cached Product' },
      ];

      const mockCacheService = vi.mocked(CacheService.prototype);
      mockCacheService.get.mockResolvedValue(cachedAlerts);

      const result = await inventoryService.getLowStockProducts();

      expect(result).toEqual(cachedAlerts);
      expect(Product.aggregate).not.toHaveBeenCalled();
    });
  });

  describe('getProductInventoryInfo', () => {
    it('should return complete inventory info for a product', async () => {
      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        variants: [{ variantId: 'v1', inventory: 10, reservedInventory: 2 }],
        lowStockThreshold: 5,
        allowBackorder: false,
        restockDate: new Date('2024-12-01'),
      };

      vi.spyOn(Product, 'findById').mockResolvedValue(mockProduct as unknown as ReturnType<typeof Product.findById>);
      vi.spyOn(inventoryService, 'getAvailableInventory').mockResolvedValue(8);

      const result = await inventoryService.getProductInventoryInfo('507f1f77bcf86cd799439011', 'v1');

      expect(result).toEqual({
        productId: '507f1f77bcf86cd799439011',
        variantId: 'v1',
        currentStock: 10,
        reservedStock: 2,
        availableStock: 8,
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

      vi.spyOn(Product, 'findById').mockResolvedValue(mockProduct as unknown as ReturnType<typeof Product.findById>);
      vi.spyOn(inventoryService, 'getAvailableInventory').mockResolvedValue(3);

      const result = await inventoryService.getProductInventoryInfo('507f1f77bcf86cd799439011', 'v1');

      expect(result.stockStatus).toBe(StockStatus.LOW_STOCK);
    });
  });


  describe('releaseReservation', () => {
    it('should delete reservation by id', async () => {
      const mockDelete = vi.spyOn(InventoryReservation, 'findByIdAndDelete').mockResolvedValue({} as unknown as ReturnType<typeof InventoryReservation.findByIdAndDelete>);

      await inventoryService.releaseReservation('reservation123');

      expect(mockDelete).toHaveBeenCalledWith('reservation123');
    });
  });

  describe('releaseSessionReservations', () => {
    it('should delete all reservations for a session', async () => {
      const mockDeleteMany = vi.spyOn(InventoryReservation, 'deleteMany').mockResolvedValue({ acknowledged: true, deletedCount: 1 } as mongoose.mongo.DeleteResult);

      await inventoryService.releaseSessionReservations('session123');

      expect(mockDeleteMany).toHaveBeenCalledWith({ sessionId: 'session123' });
    });
  });

  describe('getAvailableInventory', () => {
    it('should calculate available inventory with reservations', async () => {
      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        variants: [{ variantId: 'v1', inventory: 50 }],
      };

      vi.spyOn(Product, 'findById').mockResolvedValue(mockProduct as unknown as ReturnType<typeof Product.findById>);
      vi.spyOn(InventoryReservation, 'aggregate').mockResolvedValue([
        { totalReserved: 10 }
      ]);

      const result = await inventoryService.getAvailableInventory('507f1f77bcf86cd799439011', 'v1');

      expect(result).toBe(40);
    });

    it('should handle product without reservations', async () => {
      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        variants: [{ variantId: 'v1', inventory: 30 }],
      };

      vi.spyOn(Product, 'findById').mockResolvedValue(mockProduct as unknown as ReturnType<typeof Product.findById>);
      vi.spyOn(InventoryReservation, 'aggregate').mockResolvedValue([]);

      const result = await inventoryService.getAvailableInventory('507f1f77bcf86cd799439011', 'v1');

      expect(result).toBe(30);
    });

    it('should handle product without variants', async () => {
      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        variants: [{ inventory: 25 }],
      };

      vi.spyOn(Product, 'findById').mockResolvedValue(mockProduct as unknown as ReturnType<typeof Product.findById>);
      vi.spyOn(InventoryReservation, 'aggregate').mockResolvedValue([]);

      const result = await inventoryService.getAvailableInventory('507f1f77bcf86cd799439011');

      expect(result).toBe(25);
    });
  });

  describe('bulkUpdateInventory', () => {
    it('should handle mixed success and failure', async () => {
      const updates = [
        {
          productId: '507f1f77bcf86cd799439011',
          variantId: 'v1',
          adjustment: 10,
          reason: 'restock' as const,
        },
        {
          productId: '507f1f77bcf86cd799439012',
          variantId: 'v2',
          adjustment: -100,
          reason: 'sale' as const,
        },
      ];

      vi.spyOn(inventoryService, 'updateInventory')
        .mockResolvedValueOnce({
          success: true,
          previousQuantity: 40,
          newQuantity: 50,
          availableStock: 45,
          historyRecord: {} as any,
        })
        .mockRejectedValueOnce(new Error('Insufficient inventory'));

      const results = await inventoryService.bulkUpdateInventory(updates, 'admin123');

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });

  describe('getInventoryHistory', () => {
    it('should get paginated history', async () => {
      const mockHistory = [
        {
          productId: '507f1f77bcf86cd799439011',
          variantId: 'v1',
          previousQuantity: 40,
          newQuantity: 50,
          adjustment: 10,
          reason: 'restock',
          userId: 'admin123',
          timestamp: new Date(),
        },
      ];

      vi.spyOn(InventoryHistory, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockHistory),
      } as any);

      vi.spyOn(InventoryHistory, 'countDocuments').mockResolvedValue(100);

      const result = await inventoryService.getInventoryHistory(
        '507f1f77bcf86cd799439011',
        'v1',
        20,
        40
      );

      expect(result.history).toEqual(mockHistory);
      expect(result.total).toBe(100);
      expect(result.page).toBe(3);
      expect(result.totalPages).toBe(5);
    });
  });

  describe('getOutOfStockProducts', () => {
    it('should return cached results when available', async () => {
      const cachedProducts = [
        {
          productId: '507f1f77bcf86cd799439011',
          productName: 'Product 1',
          variantId: 'v1',
          variantDetails: 'Size M',
        },
      ];

      const mockCacheService = vi.mocked(CacheService.prototype);
      mockCacheService.get.mockResolvedValue(cachedProducts);

      const result = await inventoryService.getOutOfStockProducts();

      expect(result).toEqual(cachedProducts);
      expect(Product.aggregate).not.toHaveBeenCalled();
    });

    it('should fetch from database when cache miss', async () => {
      const mockProducts = [
        {
          productId: '507f1f77bcf86cd799439011',
          productName: 'Product 1',
          variantId: 'v1',
          variantDetails: 'Size M',
          lastInStock: new Date(),
        },
      ];

      const mockCacheService = vi.mocked(CacheService.prototype);
      mockCacheService.get.mockResolvedValue(null);
      mockCacheService.set.mockResolvedValue();

      vi.spyOn(Product, 'aggregate').mockResolvedValue(mockProducts);

      const result = await inventoryService.getOutOfStockProducts();

      expect(result).toEqual(mockProducts);
      expect(mockCacheService.set).toHaveBeenCalled();
    });
  });

  describe('getInventoryTurnover', () => {
    it('should calculate turnover data correctly', async () => {
      const mockTurnoverData = [
        {
          productId: '507f1f77bcf86cd799439011',
          productName: 'Product 1',
          variantId: 'v1',
          soldQuantity: 100,
          averageStock: 50,
          turnoverRate: 2,
        },
      ];

      vi.spyOn(InventoryHistory, 'aggregate').mockResolvedValue(mockTurnoverData);

      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31'),
      };

      const result = await inventoryService.getInventoryTurnover(dateRange);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        productId: '507f1f77bcf86cd799439011',
        productName: 'Product 1',
        turnoverRate: 2,
        period: dateRange,
      });
    });
  });

  describe('getStockValue', () => {
    it('should calculate total stock value using aggregation', async () => {
      vi.spyOn(Product, 'aggregate').mockResolvedValue([
        { totalValue: 50000 }
      ]);

      const result = await inventoryService.getStockValue();

      expect(result).toBe(50000);
    });

    it('should return 0 when no products exist', async () => {
      vi.spyOn(Product, 'aggregate').mockResolvedValue([]);

      const result = await inventoryService.getStockValue();

      expect(result).toBe(0);
    });
  });

  describe('convertReservationToPermanent', () => {
    it('should convert reservation to permanent sale', async () => {
      const mockReservation = {
        _id: 'reservation123',
        productId: '507f1f77bcf86cd799439011',
        variantId: 'v1',
        quantity: 2,
        userId: 'user123',
        deleteOne: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(InventoryReservation, 'findById').mockReturnValue({
        session: vi.fn().mockResolvedValue(mockReservation),
      } as any);

      vi.spyOn(inventoryService, 'updateInventory').mockResolvedValue({
        success: true,
        previousQuantity: 10,
        newQuantity: 8,
        availableStock: 8,
        historyRecord: {} as any,
      });

      await inventoryService.convertReservationToPermanent('reservation123', 'order123');

      expect(inventoryService.updateInventory).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'v1',
        -2,
        'sale',
        'user123',
        expect.objectContaining({ orderId: 'order123' })
      );
      expect(mockReservation.deleteOne).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });

    it('should rollback on error', async () => {
      vi.spyOn(InventoryReservation, 'findById').mockReturnValue({
        session: vi.fn().mockRejectedValue(new Error('Database error')),
      } as any);

      await expect(
        inventoryService.convertReservationToPermanent('reservation123', 'order123')
      ).rejects.toThrow('Database error');

      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle negative inventory gracefully', async () => {
      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        variants: [{ variantId: 'v1', inventory: 5 }],
      };

      vi.spyOn(Product, 'findById').mockResolvedValue(mockProduct as unknown as ReturnType<typeof Product.findById>);
      vi.spyOn(InventoryReservation, 'aggregate').mockResolvedValue([
        { totalReserved: 10 }
      ]);

      const result = await inventoryService.getAvailableInventory('507f1f77bcf86cd799439011', 'v1');

      expect(result).toBe(0); // Should not be negative
    });

    it('should handle version conflict retries', async () => {
      const versionError = new Error('Version conflict');
      versionError.name = 'VersionError';

      const updatedProduct = {
        _id: '507f1f77bcf86cd799439011',
        variants: [{ variantId: 'v1', inventory: 15 }],
      };

      vi.spyOn(Product, 'findOneAndUpdate')
        .mockRejectedValueOnce(versionError)
        .mockResolvedValueOnce(updatedProduct as unknown as ReturnType<typeof Product.findOneAndUpdate>);

      vi.spyOn(InventoryHistory.prototype, 'save').mockResolvedValue({
        toObject: () => ({ id: 'history123' }),
      } as unknown as InstanceType<typeof InventoryHistory>);

      vi.spyOn(inventoryService, 'getAvailableInventory').mockResolvedValue(15);
      vi.spyOn(CacheService.prototype, 'del').mockResolvedValue();

      const result = await inventoryService.updateInventory(
        '507f1f77bcf86cd799439011',
        'v1',
        5,
        'restock',
        'user123'
      );

      expect(result.success).toBe(true);
      expect(Product.findOneAndUpdate).toHaveBeenCalledTimes(2);
    });
  });
});