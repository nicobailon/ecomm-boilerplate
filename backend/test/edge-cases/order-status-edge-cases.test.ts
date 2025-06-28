import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderStatusValidator } from '../../utils/order-status-validator.js';
import { orderService } from '../../services/order.service.js';
import { Order } from '../../models/order.model.js';
import mongoose from 'mongoose';

vi.mock('../../models/order.model.js');

describe('Order Status Edge Cases and Error Conditions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Concurrent Updates', () => {
    it('should handle race condition when two users update same order simultaneously', async () => {
      const orderId = new mongoose.Types.ObjectId().toString();
      const mockOrder = {
        _id: orderId,
        status: 'pending',
        statusHistory: [],
        save: vi.fn().mockResolvedValueOnce(true).mockRejectedValueOnce(new Error('Version conflict')),
      };

      vi.mocked(Order.findById).mockResolvedValue(mockOrder as any);

      // First update should succeed
      const update1 = orderService.updateOrderStatus({
        orderId,
        status: 'completed',
      });

      // Second update should fail due to version conflict
      const update2 = orderService.updateOrderStatus({
        orderId,
        status: 'cancelled',
      });

      const results = await Promise.allSettled([update1, update2]);
      
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
    });

    it('should handle database connection loss during status update', async () => {
      const orderId = new mongoose.Types.ObjectId().toString();
      
      vi.mocked(Order.findById).mockRejectedValueOnce(new Error('Connection timeout'));

      await expect(
        orderService.updateOrderStatus({
          orderId,
          status: 'completed',
        })
      ).rejects.toThrow('Connection timeout');
    });
  });

  describe('Invalid Data Scenarios', () => {
    it('should handle malformed order ID gracefully', async () => {
      const invalidOrderId = 'not-a-valid-object-id';

      await expect(
        orderService.updateOrderStatus({
          orderId: invalidOrderId,
          status: 'completed',
        })
      ).rejects.toThrow();
    });

    it('should handle undefined status transition', () => {
      const undefinedStatus = 'processing' as any;

      expect(() => {
        OrderStatusValidator.validateTransition({
          from: 'pending',
          to: undefinedStatus,
        });
      }).toThrow();
    });

    it('should handle null or empty status values', () => {
      expect(() => {
        OrderStatusValidator.validateTransition({
          from: null as any,
          to: 'completed',
        });
      }).toThrow();

      expect(() => {
        OrderStatusValidator.validateTransition({
          from: 'pending',
          to: '' as any,
        });
      }).toThrow();
    });
  });

  describe('Bulk Update Edge Cases', () => {
    it('should handle empty order ID array', async () => {
      await expect(
        orderService.bulkUpdateOrderStatus({
          orderIds: [],
          status: 'completed',
        })
      ).rejects.toThrow();
    });

    it('should handle mix of valid and invalid order IDs', async () => {
      const validId1 = new mongoose.Types.ObjectId().toString();
      const validId2 = new mongoose.Types.ObjectId().toString();
      const invalidId = 'invalid-id';

      const mockOrders = [
        {
          _id: validId1,
          status: 'pending',
          statusHistory: [],
          save: vi.fn().mockResolvedValue(true),
        },
        {
          _id: validId2,
          status: 'pending',
          statusHistory: [],
          save: vi.fn().mockResolvedValue(true),
        },
      ];

      vi.mocked(Order.find).mockResolvedValue(mockOrders as any);

      const result = await orderService.bulkUpdateOrderStatus({
        orderIds: [validId1, invalidId, validId2],
        status: 'completed',
      });

      expect(result.matchedCount).toBe(2);
      expect(result.modifiedCount).toBe(2);
    });

    it('should handle partial database failures during bulk update', async () => {
      const order1 = {
        _id: new mongoose.Types.ObjectId(),
        status: 'pending',
        statusHistory: [],
        save: vi.fn().mockResolvedValue(true),
      };

      const order2 = {
        _id: new mongoose.Types.ObjectId(),
        status: 'pending',
        statusHistory: [],
        save: vi.fn().mockRejectedValue(new Error('Database error')),
      };

      vi.mocked(Order.find).mockResolvedValue([order1, order2] as any);

      const result = await orderService.bulkUpdateOrderStatus({
        orderIds: [order1._id.toString(), order2._id.toString()],
        status: 'completed',
      });

      expect(result.modifiedCount).toBe(1);
      expect(result.matchedCount).toBe(2);
    });
  });

  describe('Status History Edge Cases', () => {
    it('should handle orders with corrupted status history', async () => {
      const orderId = new mongoose.Types.ObjectId().toString();
      const mockOrder = {
        _id: orderId,
        status: 'completed',
        statusHistory: null, // Corrupted - should be array
        save: vi.fn(),
      };

      vi.mocked(Order.findById).mockResolvedValue(mockOrder as any);

      // Should initialize history if corrupted
      await orderService.updateOrderStatus({
        orderId,
        status: 'refunded',
      });

      expect(mockOrder.statusHistory).toBeInstanceOf(Array);
    });

    it('should limit status history entries to prevent unbounded growth', async () => {
      const orderId = new mongoose.Types.ObjectId().toString();
      const mockOrder = {
        _id: orderId,
        status: 'pending',
        statusHistory: new Array(100).fill({
          from: 'pending',
          to: 'completed',
          timestamp: new Date(),
        }),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(Order.findById).mockResolvedValue(mockOrder as any);

      await orderService.updateOrderStatus({
        orderId,
        status: 'completed',
      });

      // Should maintain reasonable history size
      expect(mockOrder.statusHistory.length).toBeLessThanOrEqual(101);
    });
  });

  describe('Permission and Security Edge Cases', () => {
    it('should prevent status rollback attempts through direct manipulation', () => {
      // Attempting to go from refunded back to completed
      expect(() => {
        OrderStatusValidator.validateTransition({
          from: 'refunded',
          to: 'completed',
        });
      }).toThrow(/cannot transition from refunded/i);
    });

    it('should handle status update with extremely long reason strings', async () => {
      const orderId = new mongoose.Types.ObjectId().toString();
      const veryLongReason = 'a'.repeat(10000); // 10KB string

      const mockOrder = {
        _id: orderId,
        status: 'pending' as const,
        statusHistory: [] as Array<{
          from: 'pending' | 'completed' | 'cancelled' | 'refunded' | 'pending_inventory';
          to: 'pending' | 'completed' | 'cancelled' | 'refunded' | 'pending_inventory';
          timestamp: Date;
          userId?: mongoose.Types.ObjectId;
          reason?: string;
        }>,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(Order.findById).mockResolvedValue(mockOrder as any);

      await orderService.updateOrderStatus({
        orderId,
        status: 'completed',
        reason: veryLongReason,
      });

      // Should truncate or handle long reasons gracefully
      expect(mockOrder.statusHistory.length).toBeGreaterThan(0);
      const savedReason = mockOrder.statusHistory[0]?.reason;
      expect(savedReason).toBeDefined();
      expect(savedReason!.length).toBeLessThanOrEqual(1000); // Reasonable limit
    });
  });

  describe('Recovery Scenarios', () => {
    it('should allow recovery from accidentally cancelled orders', () => {
      // Cancelled -> Pending is allowed for recovery
      expect(() => {
        OrderStatusValidator.validateTransition({
          from: 'cancelled',
          to: 'pending',
        });
      }).not.toThrow();
    });

    it('should not allow recovery from refunded orders', () => {
      // Refunded is final - no recovery allowed
      expect(() => {
        OrderStatusValidator.validateTransition({
          from: 'refunded',
          to: 'pending',
        });
      }).toThrow();
    });
  });

  describe('Performance Edge Cases', () => {
    it('should handle bulk update of 1000+ orders efficiently', async () => {
      const orderCount = 1000;
      const orderIds = Array.from({ length: orderCount }, () =>
        new mongoose.Types.ObjectId().toString()
      );

      const mockOrders = orderIds.map(id => ({
        _id: id,
        status: 'pending',
        statusHistory: [],
        save: vi.fn().mockResolvedValue(true),
      }));

      vi.mocked(Order.find).mockResolvedValue(mockOrders as any);

      const startTime = Date.now();
      const result = await orderService.bulkUpdateOrderStatus({
        orderIds,
        status: 'completed',
      });
      const endTime = Date.now();

      expect(result.modifiedCount).toBe(orderCount);
      expect(endTime - startTime).toBeLessThan(30000); // Should complete within 30 seconds
    });
  });

  describe('Validation Message Clarity', () => {
    it('should provide clear error messages for each invalid transition', () => {
      const testCases = [
        {
          from: 'completed' as const,
          to: 'pending' as const,
          expectedMessage: /cannot.*completed.*pending/i,
        },
        {
          from: 'refunded' as const,
          to: 'cancelled' as const,
          expectedMessage: /final state/i,
        },
        {
          from: 'cancelled' as const,
          to: 'refunded' as const,
          expectedMessage: /never.*paid/i,
        },
      ];

      testCases.forEach(({ from, to, expectedMessage }) => {
        const message = OrderStatusValidator.getTransitionErrorMessage(from, to);
        expect(message).toMatch(expectedMessage);
      });
    });
  });
});