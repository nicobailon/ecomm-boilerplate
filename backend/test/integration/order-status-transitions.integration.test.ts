import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { appRouter } from '../../trpc/routers/app.router.js';
import { Order } from '../../models/order.model.js';
import { User } from '../../models/user.model.js';
import { Product } from '../../models/product.model.js';
import type { IOrderDocument } from '../../models/order.model.js';
import type { IUserDocument } from '../../models/user.model.js';
import type { IProductDocument } from '../../models/product.model.js';
import { TRPCError } from '@trpc/server';

describe('Order Status Transitions Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let adminUser: IUserDocument;
  let testProduct: IProductDocument;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test data
    adminUser = await User.create({
      email: 'admin@test.com',
      password: 'password123',
      name: 'Admin User',
      role: 'admin',
      isEmailVerified: true,
    });

    testProduct = await Product.create({
      name: 'Test Product',
      description: 'Test Description',
      price: 100,
      image: 'test.jpg',
      images: ['test.jpg'],
      category: 'test',
      slug: 'test-product',
      inventory: 100,
    });

    // Create authenticated caller
    const context = {
      user: {
        _id: adminUser._id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      },
    };

    caller = appRouter.createCaller(context as any);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clean up orders between tests
    await Order.deleteMany({});
  });

  const createTestOrder = async (status: 'pending' | 'completed' | 'cancelled' | 'refunded' = 'pending'): Promise<IOrderDocument> => {
    return await Order.create({
      orderNumber: `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      stripeSessionId: `cs_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user: adminUser._id,
      email: adminUser.email,
      products: [{
        product: testProduct._id,
        quantity: 1,
        price: testProduct.price,
      }],
      totalAmount: testProduct.price,
      subtotal: testProduct.price,
      tax: 0,
      shipping: 0,
      discount: 0,
      status,
      paymentMethod: 'card',
      shippingAddress: {
        fullName: 'Test User',
        line1: '123 Test St',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        country: 'US',
      },
      statusHistory: [{
        from: 'pending',
        to: status,
        timestamp: new Date(),
        userId: adminUser._id,
        reason: 'Initial status',
      }],
    });
  };

  describe('Valid Status Transitions', () => {
    it('should allow transition from pending to completed', async () => {
      const order = await createTestOrder('pending');

      const result = await caller.order.updateStatus({
        orderId: order._id.toString(),
        status: 'completed',
      });

      expect(result.success).toBe(true);
      expect(result.order.status).toBe('completed');
      
      // Verify status history was updated
      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder?.statusHistory).toHaveLength(2);
      expect(updatedOrder?.statusHistory[1]).toMatchObject({
        from: 'pending',
        to: 'completed',
      });
    });

    it('should allow transition from pending to cancelled', async () => {
      const order = await createTestOrder('pending');

      const result = await caller.order.updateStatus({
        orderId: order._id.toString(),
        status: 'cancelled',
      });

      expect(result.success).toBe(true);
      expect(result.order.status).toBe('cancelled');
    });

    it('should allow transition from completed to refunded', async () => {
      const order = await createTestOrder('completed');

      const result = await caller.order.updateStatus({
        orderId: order._id.toString(),
        status: 'refunded',
      });

      expect(result.success).toBe(true);
      expect(result.order.status).toBe('refunded');
    });

    it('should allow transition from cancelled to pending', async () => {
      const order = await createTestOrder('cancelled');

      const result = await caller.order.updateStatus({
        orderId: order._id.toString(),
        status: 'pending',
      });

      expect(result.success).toBe(true);
      expect(result.order.status).toBe('pending');
    });
  });

  describe('Invalid Status Transitions', () => {
    it('should reject transition from completed to cancelled', async () => {
      const order = await createTestOrder('completed');

      await expect(
        caller.order.updateStatus({
          orderId: order._id.toString(),
          status: 'cancelled',
        }),
      ).rejects.toThrow(TRPCError);

      try {
        await caller.order.updateStatus({
          orderId: order._id.toString(),
          status: 'cancelled',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe('BAD_REQUEST');
        expect((error as TRPCError).message).toMatch(/Cannot (transition from completed to cancelled|cancel an order that has already been completed)/);
      }
    });

    it('should reject transition from refunded to any status', async () => {
      const order = await createTestOrder('refunded');

      // Test all possible transitions from refunded
      const invalidTransitions = ['pending', 'completed', 'cancelled'];

      for (const status of invalidTransitions) {
        await expect(
          caller.order.updateStatus({
            orderId: order._id.toString(),
            status: status as any,
          }),
        ).rejects.toThrow(TRPCError);
      }
    });

    it('should reject transition from cancelled to completed', async () => {
      const order = await createTestOrder('cancelled');

      await expect(
        caller.order.updateStatus({
          orderId: order._id.toString(),
          status: 'completed',
        }),
      ).rejects.toThrow(TRPCError);
    });

    it('should reject transition from cancelled to refunded', async () => {
      const order = await createTestOrder('cancelled');

      await expect(
        caller.order.updateStatus({
          orderId: order._id.toString(),
          status: 'refunded',
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('Bulk Status Updates', () => {
    it('should successfully update multiple orders with valid transitions', async () => {
      const order1 = await createTestOrder('pending');
      const order2 = await createTestOrder('pending');
      const order3 = await createTestOrder('pending');

      const result = await caller.order.bulkUpdateStatus({
        orderIds: [
          order1._id.toString(),
          order2._id.toString(),
          order3._id.toString(),
        ],
        status: 'completed',
      });

      expect(result.success).toBe(true);
      expect(result.modifiedCount).toBe(3);
      expect(result.matchedCount).toBe(3);

      // Verify all orders were updated
      const updatedOrders = await Order.find({
        _id: { $in: [order1._id, order2._id, order3._id] },
      });

      expect(updatedOrders).toHaveLength(3);
      expect(updatedOrders.every(o => o.status === 'completed')).toBe(true);
    });

    it('should handle mixed valid and invalid transitions in bulk update', async () => {
      const pendingOrder = await createTestOrder('pending');
      const completedOrder = await createTestOrder('completed');
      const refundedOrder = await createTestOrder('refunded');

      const result = await caller.order.bulkUpdateStatus({
        orderIds: [
          pendingOrder._id.toString(),
          completedOrder._id.toString(),
          refundedOrder._id.toString(),
        ],
        status: 'cancelled',
      });

      // Only the pending order should be updated
      expect(result.success).toBe(true);
      expect(result.modifiedCount).toBe(1);
      expect(result.matchedCount).toBe(3);
      expect(result.message).toContain('Successfully updated 1 orders');
      expect(result.message).toContain('2 orders were not updated');

      // Verify only the pending order was updated
      const updatedPending = await Order.findById(pendingOrder._id);
      const unchangedCompleted = await Order.findById(completedOrder._id);
      const unchangedRefunded = await Order.findById(refundedOrder._id);

      expect(updatedPending?.status).toBe('cancelled');
      expect(unchangedCompleted?.status).toBe('completed');
      expect(unchangedRefunded?.status).toBe('refunded');
    });

    it('should return appropriate error when no orders can be updated', async () => {
      const completedOrder1 = await createTestOrder('completed');
      const completedOrder2 = await createTestOrder('completed');

      await expect(
        caller.order.bulkUpdateStatus({
          orderIds: [
            completedOrder1._id.toString(),
            completedOrder2._id.toString(),
          ],
          status: 'pending',
        }),
      ).rejects.toThrow('Failed to update orders');
    });
  });

  describe('Status History Tracking', () => {
    it('should maintain complete status history', async () => {
      const order = await createTestOrder('pending');

      // First transition: pending -> completed
      await caller.order.updateStatus({
        orderId: order._id.toString(),
        status: 'completed',
      });

      // Second transition: completed -> refunded
      await caller.order.updateStatus({
        orderId: order._id.toString(),
        status: 'refunded',
      });

      const finalOrder = await Order.findById(order._id);
      expect(finalOrder?.statusHistory).toHaveLength(3);

      // Verify history entries
      expect(finalOrder?.statusHistory[0]).toMatchObject({
        from: 'pending',
        to: 'pending',
        reason: 'Initial status',
      });

      expect(finalOrder?.statusHistory[1]).toMatchObject({
        from: 'pending',
        to: 'completed',
      });

      expect(finalOrder?.statusHistory[2]).toMatchObject({
        from: 'completed',
        to: 'refunded',
      });

      // Verify timestamps are in order
      const timestamps = finalOrder?.statusHistory.map(h => h.timestamp.getTime()) || [];
      expect(timestamps).toEqual([...timestamps].sort());
    });

    it('should not update status history on failed transitions', async () => {
      const order = await createTestOrder('completed');
      const initialHistoryLength = order.statusHistory.length;

      try {
        await caller.order.updateStatus({
          orderId: order._id.toString(),
          status: 'pending',
        });
      } catch (error) {
        // Expected to throw
      }

      const unchangedOrder = await Order.findById(order._id);
      expect(unchangedOrder?.statusHistory).toHaveLength(initialHistoryLength);
      expect(unchangedOrder?.status).toBe('completed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-existent order gracefully', async () => {
      const fakeOrderId = new mongoose.Types.ObjectId().toString();

      await expect(
        caller.order.updateStatus({
          orderId: fakeOrderId,
          status: 'completed',
        }),
      ).rejects.toThrow(TRPCError);

      try {
        await caller.order.updateStatus({
          orderId: fakeOrderId,
          status: 'completed',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe('NOT_FOUND');
      }
    });

    it('should handle invalid order ID format', async () => {
      await expect(
        caller.order.updateStatus({
          orderId: 'invalid-id',
          status: 'completed',
        }),
      ).rejects.toThrow();
    });

    it('should handle same status transitions gracefully', async () => {
      const order = await createTestOrder('pending');

      await expect(
        caller.order.updateStatus({
          orderId: order._id.toString(),
          status: 'pending',
        }),
      ).rejects.toThrow('Invalid status transition');
    });
  });

  describe('Performance and Concurrency', () => {
    it('should handle concurrent status updates correctly', async () => {
      const order = await createTestOrder('pending');

      // Simulate concurrent updates
      const update1 = caller.order.updateStatus({
        orderId: order._id.toString(),
        status: 'completed',
      });

      const update2 = caller.order.updateStatus({
        orderId: order._id.toString(),
        status: 'cancelled',
      });

      const results = await Promise.allSettled([update1, update2]);

      // In this case, both updates might succeed if they're processed sequentially
      // or one might fail due to the changed state
      expect(results.some(r => r.status === 'fulfilled')).toBe(true);

      // The final state should be consistent
      const finalOrder = await Order.findById(order._id);
      expect(['completed', 'cancelled']).toContain(finalOrder?.status);
    });

    it('should handle large bulk updates efficiently', async () => {
      // Create 50 test orders
      const orderPromises = Array(50).fill(null).map(() => createTestOrder('pending'));
      const orders = await Promise.all(orderPromises);

      const startTime = Date.now();
      
      const result = await caller.order.bulkUpdateStatus({
        orderIds: orders.map(o => o._id.toString()),
        status: 'completed',
      });

      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.modifiedCount).toBe(50);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});