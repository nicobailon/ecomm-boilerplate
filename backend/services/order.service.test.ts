import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { orderService } from './order.service.js';
import { Order } from '../models/order.model.js';
import { AppError } from '../utils/AppError.js';
import type { ListOrdersInput, UpdateOrderStatusInput, BulkUpdateOrderStatusInput, GetOrderStatsInput } from '../validations/order.validation.js';
import mongoose from 'mongoose';

vi.mock('../models/order.model.js');

describe('OrderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listAllOrders', () => {
    const mockOrders = [
      {
        _id: new mongoose.Types.ObjectId(),
        user: { _id: new mongoose.Types.ObjectId(), email: 'user1@example.com', name: 'User 1' },
        email: 'user1@example.com',
        products: [
          {
            product: { _id: new mongoose.Types.ObjectId(), name: 'Product 1', image: 'image1.jpg' },
            quantity: 2,
            price: 50,
            variantLabel: 'Size: M',
          },
        ],
        totalAmount: 100,
        subtotal: 100,
        tax: 0,
        shipping: 0,
        discount: 0,
        status: 'completed',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        stripeSessionId: 'stripe_123',
        paymentMethod: 'card',
        couponCode: 'DISCOUNT10',
        statusHistory: [],
        shippingAddress: {},
        billingAddress: {},
      },
      {
        _id: new mongoose.Types.ObjectId(),
        user: { _id: new mongoose.Types.ObjectId(), email: 'user2@example.com', name: 'User 2' },
        email: 'user2@example.com',
        products: [
          {
            product: { _id: new mongoose.Types.ObjectId(), name: 'Product 2', image: 'image2.jpg' },
            quantity: 1,
            price: 200,
          },
        ],
        totalAmount: 200,
        subtotal: 200,
        tax: 0,
        shipping: 0,
        discount: 0,
        status: 'pending',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        stripeSessionId: 'stripe_456',
        statusHistory: [],
        shippingAddress: {},
        billingAddress: {},
      },
    ];

    it('should list orders with default pagination', async () => {
      const mockAggregate = vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue([
          {
            orders: mockOrders,
            totalCount: [{ count: 2 }],
          },
        ]),
      });
      
      Order.aggregate = mockAggregate;

      const input: ListOrdersInput = {
        page: 1,
        limit: 10,
        status: 'all',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const result = await orderService.listAllOrders(input);

      expect(result.totalCount).toBe(2);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.orders).toHaveLength(2);
      // Check that orders are serialized with string IDs
      expect(typeof result.orders[0]._id).toBe('string');
      expect(typeof result.orders[0].user._id).toBe('string');

      expect(mockAggregate).toHaveBeenCalled();
      const pipeline = mockAggregate.mock.calls[0][0];
      
      const facetStage = pipeline.find((stage: any) => stage.$facet !== undefined);
      expect(facetStage).toBeDefined();
      expect(facetStage.$facet.orders).toBeDefined();
      
      const skipStage = facetStage.$facet.orders.find((stage: any) => stage.$skip !== undefined);
      expect(skipStage.$skip).toBe(0);
      
      const limitStage = facetStage.$facet.orders.find((stage: any) => stage.$limit !== undefined);
      expect(limitStage.$limit).toBe(10);
    });

    it('should filter by status', async () => {
      const mockAggregate = vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue([
          {
            orders: [mockOrders[0]],
            totalCount: [{ count: 1 }],
          },
        ]),
      });
      
      Order.aggregate = mockAggregate;

      const input: ListOrdersInput = {
        page: 1,
        limit: 10,
        status: 'completed',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      await orderService.listAllOrders(input);

      const pipeline = mockAggregate.mock.calls[0][0];
      const matchStage = pipeline.find((stage: any) => stage.$match !== undefined);
      expect(matchStage.$match.status).toBe('completed');
    });

    it('should search by user email and order ID', async () => {
      const mockAggregate = vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue([
          {
            orders: mockOrders,
            totalCount: [{ count: 2 }],
          },
        ]),
      });
      
      Order.aggregate = mockAggregate;

      const input: ListOrdersInput = {
        page: 1,
        limit: 10,
        search: 'user@example.com',
        status: 'all',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      await orderService.listAllOrders(input);

      const pipeline = mockAggregate.mock.calls[0][0];
      const matchStage = pipeline.find((stage: any) => stage.$match?.$or !== undefined);
      expect(matchStage.$match.$or).toHaveLength(2);
      expect(matchStage.$match.$or[0]['user.email']).toMatchObject({ $regex: 'user@example.com', $options: 'i' });
    });

    it('should filter by date range', async () => {
      const mockAggregate = vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue([
          {
            orders: mockOrders,
            totalCount: [{ count: 2 }],
          },
        ]),
      });
      
      Order.aggregate = mockAggregate;

      const input: ListOrdersInput = {
        page: 1,
        limit: 10,
        status: 'all',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        dateFrom: '2024-01-01T00:00:00.000Z',
        dateTo: '2024-01-31T23:59:59.999Z',
      };

      await orderService.listAllOrders(input);

      const pipeline = mockAggregate.mock.calls[0][0];
      const matchStage = pipeline.find((stage: any) => stage.$match?.createdAt !== undefined);
      expect(matchStage.$match.createdAt.$gte).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(matchStage.$match.createdAt.$lte).toEqual(new Date('2024-01-31T23:59:59.999Z'));
    });

    it('should sort by different fields', async () => {
      const mockAggregate = vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue([
          {
            orders: mockOrders,
            totalCount: [{ count: 2 }],
          },
        ]),
      });
      
      Order.aggregate = mockAggregate;

      const input: ListOrdersInput = {
        page: 1,
        limit: 10,
        status: 'all',
        sortBy: 'total',
        sortOrder: 'asc',
      };

      await orderService.listAllOrders(input);

      const pipeline = mockAggregate.mock.calls[0][0];
      const facetStage = pipeline.find((stage: any) => stage.$facet !== undefined);
      expect(facetStage).toBeDefined();
      const sortStage = facetStage.$facet.orders.find((stage: any) => stage.$sort !== undefined);
      expect(sortStage.$sort).toEqual({ totalAmount: 1 });
    });

    it('should handle pagination correctly', async () => {
      const mockAggregate = vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue([
          {
            orders: [],
            totalCount: [{ count: 50 }],
          },
        ]),
      });
      
      Order.aggregate = mockAggregate;

      const input: ListOrdersInput = {
        page: 3,
        limit: 20,
        status: 'all',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const result = await orderService.listAllOrders(input);

      expect(result.totalPages).toBe(3);
      expect(result.currentPage).toBe(3);
      
      const pipeline = mockAggregate.mock.calls[0][0];
      const facetStage = pipeline.find((stage: any) => stage.$facet !== undefined);
      expect(facetStage).toBeDefined();
      const skipStage = facetStage.$facet.orders.find((stage: any) => stage.$skip !== undefined);
      expect(skipStage.$skip).toBe(40);
    });

    it('should handle empty results', async () => {
      const mockAggregate = vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue([]),
      });
      
      Order.aggregate = mockAggregate;

      const input: ListOrdersInput = {
        page: 1,
        limit: 10,
        status: 'all',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const result = await orderService.listAllOrders(input);

      expect(result).toEqual({
        orders: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 0,
      });
    });

    describe('Customer filtering', () => {
      it('should return only user orders when userId provided', async () => {
        const userId = new mongoose.Types.ObjectId().toString();
        const mockAggregate = vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue([
            {
              orders: [mockOrders[0]],
              totalCount: [{ count: 1 }],
            },
          ]),
        });
        
        Order.aggregate = mockAggregate;

        const input: ListOrdersInput & { userId?: string } = {
          page: 1,
          limit: 10,
          status: 'all',
          sortBy: 'createdAt',
          sortOrder: 'desc',
          userId: userId,
        };

        const result = await orderService.listAllOrders(input);

        expect(result.orders).toHaveLength(1);
        expect(result.totalCount).toBe(1);

        const pipeline = mockAggregate.mock.calls[0][0];
        const matchStage = pipeline.find((stage: any) => stage.$match !== undefined);
        expect(matchStage.$match.user).toEqual(new mongoose.Types.ObjectId(userId));
      });

      it('should return all orders when userId not provided (admin behavior)', async () => {
        const mockAggregate = vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue([
            {
              orders: mockOrders,
              totalCount: [{ count: 2 }],
            },
          ]),
        });
        
        Order.aggregate = mockAggregate;

        const input: ListOrdersInput = {
          page: 1,
          limit: 10,
          status: 'all',
          sortBy: 'createdAt',
          sortOrder: 'desc',
        };

        const result = await orderService.listAllOrders(input);

        expect(result.orders).toHaveLength(2);
        expect(result.totalCount).toBe(2);

        const pipeline = mockAggregate.mock.calls[0][0];
        const matchStages = pipeline.filter((stage: any) => stage.$match !== undefined);
        const hasUserFilter = matchStages.some((stage: any) => stage.$match.user !== undefined);
        expect(hasUserFilter).toBe(false);
      });

      it('should handle invalid userId format gracefully', async () => {
        const mockAggregate = vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue([
            {
              orders: [],
              totalCount: [{ count: 0 }],
            },
          ]),
        });
        
        Order.aggregate = mockAggregate;

        const input: ListOrdersInput & { userId?: string } = {
          page: 1,
          limit: 10,
          status: 'all',
          sortBy: 'createdAt',
          sortOrder: 'desc',
          userId: 'invalid-object-id',
        };

        // Should throw an error when creating ObjectId with invalid format
        await expect(orderService.listAllOrders(input)).rejects.toThrow();
      });

      it('should return empty list for user with no orders', async () => {
        const userId = new mongoose.Types.ObjectId().toString();
        const mockAggregate = vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue([
            {
              orders: [],
              totalCount: [{ count: 0 }],
            },
          ]),
        });
        
        Order.aggregate = mockAggregate;

        const input: ListOrdersInput & { userId?: string } = {
          page: 1,
          limit: 10,
          status: 'all',
          sortBy: 'createdAt',
          sortOrder: 'desc',
          userId: userId,
        };

        const result = await orderService.listAllOrders(input);

        expect(result).toEqual({
          orders: [],
          totalCount: 0,
          currentPage: 1,
          totalPages: 0,
        });
      });
    });
  });

  describe('getOrderById', () => {
    it('should return populated order by ID', async () => {
      const mockOrder = {
        _id: new mongoose.Types.ObjectId(),
        user: { _id: new mongoose.Types.ObjectId(), email: 'user@example.com', name: 'Test User' },
        email: 'user@example.com',
        products: [
          {
            product: { _id: new mongoose.Types.ObjectId(), name: 'Product 1', image: 'image1.jpg' },
            quantity: 2,
            price: 50,
          },
        ],
        totalAmount: 100,
        subtotal: 100,
        tax: 0,
        shipping: 0,
        discount: 0,
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
        statusHistory: [],
        shippingAddress: {},
        billingAddress: {},
      };

      const mockPopulate = vi.fn().mockResolvedValue(mockOrder);
      Order.findById = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: mockPopulate,
        }),
      });

      const result = await orderService.getOrderById('507f1f77bcf86cd799439011');

      expect(result._id).toBe(mockOrder._id.toString());
      expect(result.status).toBe('completed');
      expect(result.totalAmount).toBe(100);
      expect(Order.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw error if order not found', async () => {
      Order.findById = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(null),
        }),
      });

      await expect(orderService.getOrderById('507f1f77bcf86cd799439011'))
        .rejects.toThrow(new AppError('Order not found', 404));
    });

    describe('Customer filtering', () => {
      it('should return order only if owned by user', async () => {
        const userId = new mongoose.Types.ObjectId().toString();
        const mockOrder = {
          _id: new mongoose.Types.ObjectId(),
          user: { _id: userId, email: 'user@example.com', name: 'Test User' },
          email: 'user@example.com',
          products: [],
          totalAmount: 100,
          subtotal: 100,
          tax: 0,
          shipping: 0,
          discount: 0,
          status: 'completed',
          statusHistory: [],
          shippingAddress: {},
          billingAddress: {},
        };

        const mockPopulate = vi.fn().mockResolvedValue(mockOrder);
        Order.findOne = vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: mockPopulate,
          }),
        });

        const result = await orderService.getOrderById('507f1f77bcf86cd799439011', userId);

        expect(result._id).toBe(mockOrder._id.toString());
        expect(result.status).toBe('completed');
        expect(result.totalAmount).toBe(100);
        expect(Order.findOne).toHaveBeenCalledWith({ _id: '507f1f77bcf86cd799439011', user: userId });
      });

      it('should throw 404 for unowned orders', async () => {
        const userId = new mongoose.Types.ObjectId().toString();

        Order.findOne = vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockResolvedValue(null),
          }),
        });

        await expect(orderService.getOrderById('507f1f77bcf86cd799439011', userId))
          .rejects.toThrow(new AppError('Order not found', 404));
      });

      it('should return any order when userId not provided (admin behavior)', async () => {
        const mockOrder = {
          _id: new mongoose.Types.ObjectId(),
          user: { _id: new mongoose.Types.ObjectId(), email: 'user@example.com', name: 'Test User' },
          email: 'user@example.com',
          products: [],
          totalAmount: 100,
          subtotal: 100,
          tax: 0,
          shipping: 0,
          discount: 0,
          status: 'completed',
          statusHistory: [],
          shippingAddress: {},
          billingAddress: {},
        };

        const mockPopulate = vi.fn().mockResolvedValue(mockOrder);
        Order.findById = vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: mockPopulate,
          }),
        });

        const result = await orderService.getOrderById('507f1f77bcf86cd799439011');

        expect(result._id).toBe(mockOrder._id.toString());
        expect(result.status).toBe('completed');
        expect(result.totalAmount).toBe(100);
        expect(Order.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      });
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      const mockOrder = {
        _id: new mongoose.Types.ObjectId(),
        status: 'pending',
        statusHistory: [],
        save: vi.fn().mockResolvedValue(true),
      };

      const updatedMockOrder = {
        ...mockOrder,
        user: { _id: new mongoose.Types.ObjectId(), email: 'user@example.com', name: 'Test User' },
        email: 'user@example.com',
        products: [],
        totalAmount: 100,
        subtotal: 100,
        tax: 0,
        shipping: 0,
        discount: 0,
        status: 'completed',
        shippingAddress: {},
        billingAddress: {},
      };

      Order.findById = vi.fn()
        .mockResolvedValueOnce(mockOrder)
        .mockReturnValueOnce({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockResolvedValue(updatedMockOrder),
          }),
        });

      const input: UpdateOrderStatusInput = {
        orderId: '507f1f77bcf86cd799439011',
        status: 'completed',
      };

      const result = await orderService.updateOrderStatus(input);

      expect(result.status).toBe('completed');
      expect(mockOrder.save).toHaveBeenCalled();
    });

    it('should throw error if order not found', async () => {
      Order.findById = vi.fn().mockResolvedValue(null);

      const input: UpdateOrderStatusInput = {
        orderId: '507f1f77bcf86cd799439011',
        status: 'completed',
      };

      await expect(orderService.updateOrderStatus(input))
        .rejects.toThrow(new AppError('Order not found', 404));
    });

    it('should not allow invalid status transitions', async () => {
      const mockOrder = {
        _id: new mongoose.Types.ObjectId(),
        status: 'cancelled',
        statusHistory: [],
        save: vi.fn(),
      };

      Order.findById = vi.fn().mockResolvedValue(mockOrder);

      const input: UpdateOrderStatusInput = {
        orderId: '507f1f77bcf86cd799439011',
        status: 'completed',
      };

      await expect(orderService.updateOrderStatus(input))
        .rejects.toThrow(new AppError('A cancelled order must be reactivated to pending status first', 400));
    });
  });

  describe('bulkUpdateOrderStatus', () => {
    it('should update multiple orders successfully', async () => {
      const mockOrders = [
        { _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'), status: 'pending', statusHistory: [] },
        { _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'), status: 'pending', statusHistory: [] },
        { _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'), status: 'pending', statusHistory: [] },
      ];

      // Mock for both transactional and non-transactional paths
      Order.find = vi.fn().mockImplementation((query) => {
        if (query) {
          // Non-transactional path
          return Promise.resolve(mockOrders);
        }
        // Transactional path
        return {
          session: vi.fn().mockReturnValue(Promise.resolve(mockOrders)),
        };
      });

      const bulkWriteResult = {
        modifiedCount: 3,
      };

      Order.bulkWrite = vi.fn().mockResolvedValue(bulkWriteResult);

      // Mock mongoose session
      const mockSession = {
        startTransaction: vi.fn(),
        commitTransaction: vi.fn(),
        abortTransaction: vi.fn(),
        endSession: vi.fn(),
      };
      
      vi.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession as any);

      const input: BulkUpdateOrderStatusInput = {
        orderIds: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
        status: 'completed',
      };

      const result = await orderService.bulkUpdateOrderStatus(input);

      expect(result).toEqual({
        success: true,
        message: 'Successfully updated 3 orders',
        matchedCount: 3,
        modifiedCount: 3,
      });

      expect(Order.bulkWrite).toHaveBeenCalled();
    });

    it('should handle partial updates', async () => {
      const mockOrders = [
        { _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'), status: 'pending', statusHistory: [] },
        { _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'), status: 'pending', statusHistory: [] },
        { _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'), status: 'cancelled', statusHistory: [] },
      ];

      // Mock for both transactional and non-transactional paths
      Order.find = vi.fn().mockImplementation((query) => {
        if (query) {
          // Non-transactional path
          return Promise.resolve(mockOrders);
        }
        // Transactional path
        return {
          session: vi.fn().mockReturnValue(Promise.resolve(mockOrders)),
        };
      });

      const bulkWriteResult = {
        modifiedCount: 2,
      };

      Order.bulkWrite = vi.fn().mockResolvedValue(bulkWriteResult);

      // Mock mongoose session
      const mockSession = {
        startTransaction: vi.fn(),
        commitTransaction: vi.fn(),
        abortTransaction: vi.fn(),
        endSession: vi.fn(),
      };
      
      vi.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession as any);

      const input: BulkUpdateOrderStatusInput = {
        orderIds: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
        status: 'completed',
      };

      const result = await orderService.bulkUpdateOrderStatus(input);

      expect(result.message).toContain('Successfully updated 2 orders');
      expect(result.message).toContain('1 orders were not updated');
    });

    it('should throw error if no orders found', async () => {
      // Mock for both transactional and non-transactional paths
      Order.find = vi.fn().mockImplementation((query) => {
        if (query) {
          // Non-transactional path
          return Promise.resolve([]);
        }
        // Transactional path
        return {
          session: vi.fn().mockReturnValue(Promise.resolve([])),
        };
      });

      // Mock mongoose session
      const mockSession = {
        startTransaction: vi.fn(),
        commitTransaction: vi.fn(),
        abortTransaction: vi.fn(),
        endSession: vi.fn(),
      };
      
      vi.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession as any);

      const input: BulkUpdateOrderStatusInput = {
        orderIds: ['507f1f77bcf86cd799439011'],
        status: 'completed',
      };

      await expect(orderService.bulkUpdateOrderStatus(input))
        .rejects.toThrow(new AppError('No orders found', 404));
    });
  });

  describe('getOrderStats', () => {
    it('should return order statistics', async () => {
      const mockStats = [
        {
          _id: null,
          totalOrders: 100,
          totalRevenue: 10000,
          averageOrderValue: 100,
          statusCounts: [
            { _id: 'completed', count: 70 },
            { _id: 'pending', count: 20 },
            { _id: 'cancelled', count: 8 },
            { _id: 'refunded', count: 2 },
          ],
          revenueByDay: [
            { _id: { year: 2024, month: 1, day: 1 }, revenue: 500, count: 5 },
            { _id: { year: 2024, month: 1, day: 2 }, revenue: 800, count: 8 },
          ],
          topProducts: [
            { _id: new mongoose.Types.ObjectId(), name: 'Product 1', totalSold: 50, revenue: 2500 },
            { _id: new mongoose.Types.ObjectId(), name: 'Product 2', totalSold: 30, revenue: 3000 },
          ],
        },
      ];

      Order.aggregate = vi.fn().mockResolvedValue(mockStats);

      const input: GetOrderStatsInput = {
        dateFrom: '2024-01-01T00:00:00.000Z',
        dateTo: '2024-01-31T23:59:59.999Z',
      };

      const result = await orderService.getOrderStats(input);

      expect(result.totalOrders).toBe(100);
      expect(result.totalRevenue).toBe(10000);
      expect(result.averageOrderValue).toBe(100);
      expect(result.statusBreakdown).toEqual({
        completed: 70,
        pending: 20,
        cancelled: 8,
        refunded: 2,
      });
      expect(result.revenueByDay).toEqual(mockStats[0].revenueByDay);
      expect(result.topProducts).toHaveLength(2);
      // Check that product IDs are serialized to strings
      expect(typeof result.topProducts[0]._id).toBe('string');

      const pipeline = (Order.aggregate as Mock).mock.calls[0][0];
      const matchStage = pipeline.find((stage: any) => stage.$match !== undefined);
      expect(matchStage.$match.createdAt).toBeDefined();
    });

    it('should handle stats without date filter', async () => {
      const mockStats = [
        {
          _id: null,
          totalOrders: 1000,
          totalRevenue: 100000,
          averageOrderValue: 100,
          statusCounts: [],
          revenueByDay: [],
          topProducts: [],
        },
      ];

      Order.aggregate = vi.fn().mockResolvedValue(mockStats);

      const result = await orderService.getOrderStats({});

      expect(result.totalOrders).toBe(1000);
      
      const pipeline = (Order.aggregate as Mock).mock.calls[0][0];
      const hasDateMatch = pipeline.some((stage: any) => stage.$match?.createdAt !== undefined);
      expect(hasDateMatch).toBe(false);
    });

    it('should handle empty stats', async () => {
      Order.aggregate = vi.fn().mockResolvedValue([]);

      const result = await orderService.getOrderStats({});

      expect(result).toEqual({
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        statusBreakdown: {
          pending: 0,
          completed: 0,
          cancelled: 0,
          refunded: 0,
        },
        revenueByDay: [],
        topProducts: [],
      });
    });
  });
});