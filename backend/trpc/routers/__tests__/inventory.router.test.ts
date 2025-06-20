import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestContext } from '../../../test/helpers/test-context.js';
import { inventoryRouter } from '../inventory.router.js';
import { inventoryService } from '../../../services/inventory.service.js';
import { AppError } from '../../../utils/AppError.js';
import { StockStatus, type IInventoryHistory } from '../../../../shared/types/inventory.types.js';
import type { IUserDocument } from '../../../models/user.model.js';

vi.mock('../../../services/inventory.service.js');

describe('inventoryRouter', () => {
  const mockUser = {
    _id: { toString: () => 'user123' },
    email: 'admin@test.com',
    role: 'admin',
  } as unknown as IUserDocument;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkAvailability', () => {
    it('should check product availability successfully', async () => {
      const ctx = createTestContext();
      const caller = inventoryRouter.createCaller(() => ctx);

      vi.spyOn(inventoryService, 'checkAvailability').mockResolvedValue(true);
      vi.spyOn(inventoryService, 'getAvailableInventory').mockResolvedValue(40);

      const result = await caller.checkAvailability({
        productId: '507f1f77bcf86cd799439011',
        variantId: 'v1',
        quantity: 5,
      });

      expect(result).toEqual({
        isAvailable: true,
        availableStock: 40,
        requestedQuantity: 5,
      });
    });

    it('should return false when inventory is insufficient', async () => {
      const ctx = createTestContext();
      const caller = inventoryRouter.createCaller(() => ctx);

      vi.spyOn(inventoryService, 'checkAvailability').mockResolvedValue(false);
      vi.spyOn(inventoryService, 'getAvailableInventory').mockResolvedValue(3);

      const result = await caller.checkAvailability({
        productId: '507f1f77bcf86cd799439011',
        variantId: 'v1',
        quantity: 10,
      });

      expect(result).toEqual({
        isAvailable: false,
        availableStock: 3,
        requestedQuantity: 10,
      });
    });

    it('should handle errors gracefully', async () => {
      const ctx = createTestContext();
      const caller = inventoryRouter.createCaller(() => ctx);

      vi.spyOn(inventoryService, 'checkAvailability').mockRejectedValue(
        new AppError('Product not found', 404)
      );

      await expect(
        caller.checkAvailability({
          productId: '507f1f77bcf86cd799439011',
          variantId: 'v1',
          quantity: 5,
        })
      ).rejects.toThrow('Product not found');
    });
  });

  describe('getProductInventory', () => {
    it('should get product inventory info successfully', async () => {
      const ctx = createTestContext();
      const caller = inventoryRouter.createCaller(() => ctx);

      const mockInventoryInfo = {
        productId: '507f1f77bcf86cd799439011',
        variantId: 'v1',
        currentStock: 50,
        reservedStock: 10,
        availableStock: 40,
        lowStockThreshold: 10,
        allowBackorder: false,
        restockDate: new Date('2024-12-01'),
        stockStatus: StockStatus.IN_STOCK,
      };

      vi.spyOn(inventoryService, 'getProductInventoryInfo').mockResolvedValue(
        mockInventoryInfo
      );

      const result = await caller.getProductInventory({
        productId: '507f1f77bcf86cd799439011',
        variantId: 'v1',
      });

      expect(result).toEqual(mockInventoryInfo);
    });

    it('should handle product not found error', async () => {
      const ctx = createTestContext();
      const caller = inventoryRouter.createCaller(() => ctx);

      vi.spyOn(inventoryService, 'getProductInventoryInfo').mockRejectedValue(
        new AppError('Product not found', 404)
      );

      await expect(
        caller.getProductInventory({
          productId: '507f1f77bcf86cd799439011',
        })
      ).rejects.toThrow('Product not found');
    });
  });

  describe('updateInventory', () => {
    it('should update inventory successfully', async () => {
      const ctx = createTestContext({ user: mockUser });
      const caller = inventoryRouter.createCaller(() => ctx);

      const mockResult = {
        success: true,
        previousQuantity: 40,
        newQuantity: 50,
        availableStock: 45,
        historyRecord: {
          productId: '507f1f77bcf86cd799439011',
          variantId: 'v1',
          previousQuantity: 40,
          newQuantity: 50,
          adjustment: 10,
          reason: 'restock',
          userId: 'user123',
          timestamp: new Date(),
        } as IInventoryHistory,
      };

      vi.spyOn(inventoryService, 'updateInventory').mockResolvedValue(mockResult);

      const result = await caller.updateInventory({
        productId: '507f1f77bcf86cd799439011',
        variantId: 'v1',
        adjustment: 10,
        reason: 'restock',
        metadata: { supplier: 'Supplier A' },
      });

      expect(result).toEqual(mockResult);
      expect(inventoryService.updateInventory).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'v1',
        10,
        'restock',
        'user123',
        { supplier: 'Supplier A' }
      );
    });

    it('should require admin role', async () => {
      const userWithUserRole = {
        _id: { toString: () => 'user123' },
        email: 'user@test.com',
        role: 'user',
      } as unknown as IUserDocument;
      const ctx = createTestContext({ user: userWithUserRole });
      const caller = inventoryRouter.createCaller(() => ctx);

      await expect(
        caller.updateInventory({
          productId: '507f1f77bcf86cd799439011',
          adjustment: 10,
          reason: 'restock',
        })
      ).rejects.toThrow();
    });

    it('should require authentication', async () => {
      const ctx = createTestContext({ user: null });
      const caller = inventoryRouter.createCaller(() => ctx);

      await expect(
        caller.updateInventory({
          productId: '507f1f77bcf86cd799439011',
          adjustment: 10,
          reason: 'restock',
        })
      ).rejects.toThrow();
    });
  });

  describe('bulkUpdateInventory', () => {
    it('should update multiple inventories successfully', async () => {
      const ctx = createTestContext({ user: mockUser });
      const caller = inventoryRouter.createCaller(() => ctx);

      const mockResults = [
        {
          success: true,
          previousQuantity: 40,
          newQuantity: 50,
          availableStock: 45,
          historyRecord: {} as IInventoryHistory,
        },
        {
          success: false,
          previousQuantity: 10,
          newQuantity: 10,
          availableStock: 10,
          historyRecord: {} as IInventoryHistory,
        },
      ];

      vi.spyOn(inventoryService, 'bulkUpdateInventory').mockResolvedValue(mockResults);

      const result = await caller.bulkUpdateInventory({
        updates: [
          {
            productId: '507f1f77bcf86cd799439011',
            variantId: 'v1',
            adjustment: 10,
            reason: 'restock',
          },
          {
            productId: '507f1f77bcf86cd799439012',
            variantId: 'v2',
            adjustment: -100,
            reason: 'sale',
          },
        ],
      });

      expect(result).toEqual(mockResults);
    });
  });

  describe('getInventoryHistory', () => {
    it('should get inventory history with pagination', async () => {
      const ctx = createTestContext({ user: mockUser });
      const caller = inventoryRouter.createCaller(() => ctx);

      const mockHistory = {
        history: [
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
        ],
        total: 100,
        page: 2,
        totalPages: 5,
      };

      vi.spyOn(inventoryService, 'getInventoryHistory').mockResolvedValue(mockHistory as any);

      const result = await caller.getInventoryHistory({
        productId: '507f1f77bcf86cd799439011',
        variantId: 'v1',
        limit: 20,
        offset: 20,
      });

      expect(result).toEqual(mockHistory);
    });
  });

  describe('getLowStockProducts', () => {
    it('should get low stock products with pagination', async () => {
      const ctx = createTestContext({ user: mockUser });
      const caller = inventoryRouter.createCaller(() => ctx);

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

      vi.spyOn(inventoryService, 'getLowStockProducts').mockResolvedValue(mockAlerts);

      const result = await caller.getLowStockProducts({
        threshold: 5,
        page: 1,
        limit: 20,
      });

      expect(result).toEqual({
        alerts: mockAlerts,
        total: 1,
        page: 1,
        totalPages: 1,
      });
    });
  });

  describe('getInventoryMetrics', () => {
    it('should get inventory metrics', async () => {
      const ctx = createTestContext({ user: mockUser });
      const caller = inventoryRouter.createCaller(() => ctx);

      const mockMetrics = {
        totalProducts: 100,
        totalValue: 50000,
        outOfStockCount: 5,
        lowStockCount: 10,
        totalReserved: 20,
      };

      vi.spyOn(inventoryService, 'getInventoryMetrics').mockResolvedValue(mockMetrics);

      const result = await caller.getInventoryMetrics();

      expect(result).toEqual(mockMetrics);
    });
  });

  describe('getOutOfStockProducts', () => {
    it('should get out of stock products', async () => {
      const ctx = createTestContext({ user: mockUser });
      const caller = inventoryRouter.createCaller(() => ctx);

      const mockProducts = [
        {
          productId: '507f1f77bcf86cd799439011',
          productName: 'Product 1',
          variantId: 'v1',
          variantDetails: 'Size M',
          lastInStock: new Date(),
        },
      ];

      vi.spyOn(inventoryService, 'getOutOfStockProducts').mockResolvedValue(mockProducts);

      const result = await caller.getOutOfStockProducts();

      expect(result).toEqual(mockProducts);
    });
  });

  describe('getInventoryTurnover', () => {
    it('should get inventory turnover data', async () => {
      const ctx = createTestContext({ user: mockUser });
      const caller = inventoryRouter.createCaller(() => ctx);

      const mockTurnoverData = [
        {
          productId: '507f1f77bcf86cd799439011',
          productName: 'Product 1',
          variantId: 'v1',
          soldQuantity: 100,
          averageStock: 50,
          turnoverRate: 2,
          period: {
            start: new Date('2024-01-01'),
            end: new Date('2024-12-31'),
          },
        },
      ];

      vi.spyOn(inventoryService, 'getInventoryTurnover').mockResolvedValue(
        mockTurnoverData
      );

      const result = await caller.getInventoryTurnover({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      expect(result).toEqual(mockTurnoverData);
    });
  });

  describe('reserveInventory', () => {
    it('should reserve inventory successfully', async () => {
      const ctx = createTestContext({ user: mockUser });
      const caller = inventoryRouter.createCaller(() => ctx);

      const mockReservation = {
        success: true,
        reservationId: 'reservation123',
        availableStock: 35,
      };

      vi.spyOn(inventoryService, 'reserveInventory').mockResolvedValue(mockReservation);

      const result = await caller.reserveInventory({
        productId: '507f1f77bcf86cd799439011',
        variantId: 'v1',
        quantity: 5,
        sessionId: 'session123',
        duration: 30 * 60 * 1000,
      });

      expect(result).toEqual(mockReservation);
    });

    it('should handle insufficient inventory', async () => {
      const ctx = createTestContext({ user: mockUser });
      const caller = inventoryRouter.createCaller(() => ctx);

      const mockReservation = {
        success: false,
        availableStock: 5,
        message: 'Only 5 items available',
      };

      vi.spyOn(inventoryService, 'reserveInventory').mockResolvedValue(mockReservation);

      const result = await caller.reserveInventory({
        productId: '507f1f77bcf86cd799439011',
        variantId: 'v1',
        quantity: 10,
        sessionId: 'session123',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Only 5 items available');
    });
  });

  describe('releaseReservation', () => {
    it('should release reservation successfully', async () => {
      const ctx = createTestContext({ user: mockUser });
      const caller = inventoryRouter.createCaller(() => ctx);

      vi.spyOn(inventoryService, 'releaseReservation').mockResolvedValue();

      const result = await caller.releaseReservation({
        reservationId: 'reservation123',
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe('releaseSessionReservations', () => {
    it('should release all session reservations', async () => {
      const ctx = createTestContext({ user: mockUser });
      const caller = inventoryRouter.createCaller(() => ctx);

      vi.spyOn(inventoryService, 'releaseSessionReservations').mockResolvedValue();

      const result = await caller.releaseSessionReservations({
        sessionId: 'session123',
      });

      expect(result).toEqual({ success: true });
    });
  });
});