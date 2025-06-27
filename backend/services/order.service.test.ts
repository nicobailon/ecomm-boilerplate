import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { orderService } from './order.service.js';
import { Order } from '../models/order.model.js';
import { AppError } from '../utils/AppError.js';
import type { ListOrdersInput, UpdateOrderStatusInput, BulkUpdateOrderStatusInput, GetOrderStatsInput } from '../validations/order.validation.js';
import type { OrderListResponse, OrderStats, OrderWithPopulatedData } from '../types/order.types.js';
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
        products: [
          {
            product: { _id: new mongoose.Types.ObjectId(), name: 'Product 1', image: 'image1.jpg' },
            quantity: 2,
            price: 50,
            variantLabel: 'Size: M',
          }
        ],
        totalAmount: 100,
        status: 'completed',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        stripeSessionId: 'stripe_123',
        paymentMethod: 'card',
        couponCode: 'DISCOUNT10',
      },
      {
        _id: new mongoose.Types.ObjectId(),
        user: { _id: new mongoose.Types.ObjectId(), email: 'user2@example.com', name: 'User 2' },
        products: [
          {
            product: { _id: new mongoose.Types.ObjectId(), name: 'Product 2', image: 'image2.jpg' },
            quantity: 1,
            price: 200,
          }
        ],
        totalAmount: 200,
        status: 'pending',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        stripeSessionId: 'stripe_456',
      }
    ];

    it('should list orders with default pagination', async () => {
      const mockAggregate = vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue([
          {
            orders: mockOrders,
            totalCount: [{ count: 2 }],
          }
        ])
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

      expect(result).toMatchObject({
        orders: mockOrders,
        totalCount: 2,
        currentPage: 1,
        totalPages: 1,
      });

      expect(mockAggregate).toHaveBeenCalled();
      const pipeline = mockAggregate.mock.calls[0][0];
      
      const skipStage = pipeline.find((stage: any) => stage.$skip !== undefined);
      expect(skipStage.$skip).toBe(0);
      
      const limitStage = pipeline.find((stage: any) => stage.$limit !== undefined);
      expect(limitStage.$limit).toBe(10);
    });

    it('should filter by status', async () => {
      const mockAggregate = vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue([
          {
            orders: [mockOrders[0]],
            totalCount: [{ count: 1 }],
          }
        ])
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
          }
        ])
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
          }
        ])
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
          }
        ])
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
      const sortStage = pipeline.find((stage: any) => stage.$sort !== undefined);
      expect(sortStage.$sort).toEqual({ totalAmount: 1 });
    });

    it('should handle pagination correctly', async () => {
      const mockAggregate = vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue([
          {
            orders: [],
            totalCount: [{ count: 50 }],
          }
        ])
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
      const skipStage = pipeline.find((stage: any) => stage.$skip !== undefined);
      expect(skipStage.$skip).toBe(40);
    });

    it('should handle empty results', async () => {
      const mockAggregate = vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue([])
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
  });

  describe('getOrderById', () => {
    it('should return populated order by ID', async () => {
      const mockOrder = {
        _id: new mongoose.Types.ObjectId(),
        user: { _id: new mongoose.Types.ObjectId(), email: 'user@example.com', name: 'Test User' },
        products: [
          {
            product: { _id: new mongoose.Types.ObjectId(), name: 'Product 1', image: 'image1.jpg' },
            quantity: 2,
            price: 50,
          }
        ],
        totalAmount: 100,
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPopulate = vi.fn().mockResolvedValue(mockOrder);
      Order.findById = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: mockPopulate,
        }),
      });

      const result = await orderService.getOrderById('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockOrder);
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
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      const mockOrder = {
        _id: new mongoose.Types.ObjectId(),
        status: 'pending',
        save: vi.fn().mockResolvedValue(true),
      };

      Order.findById = vi.fn().mockResolvedValue(mockOrder);

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
        save: vi.fn(),
      };

      Order.findById = vi.fn().mockResolvedValue(mockOrder);

      const input: UpdateOrderStatusInput = {
        orderId: '507f1f77bcf86cd799439011',
        status: 'completed',
      };

      await expect(orderService.updateOrderStatus(input))
        .rejects.toThrow(new AppError('Cannot change status from cancelled to completed', 400));
    });
  });

  describe('bulkUpdateOrderStatus', () => {
    it('should update multiple orders successfully', async () => {
      const mockUpdateMany = {
        matchedCount: 3,
        modifiedCount: 3,
      };

      Order.updateMany = vi.fn().mockResolvedValue(mockUpdateMany);

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

      expect(Order.updateMany).toHaveBeenCalledWith(
        { 
          _id: { $in: input.orderIds },
          status: { $nin: ['cancelled', 'refunded'] },
        },
        { 
          $set: { status: 'completed', updatedAt: expect.any(Date) },
        }
      );
    });

    it('should handle partial updates', async () => {
      const mockUpdateMany = {
        matchedCount: 2,
        modifiedCount: 2,
      };

      Order.updateMany = vi.fn().mockResolvedValue(mockUpdateMany);

      const input: BulkUpdateOrderStatusInput = {
        orderIds: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
        status: 'completed',
      };

      const result = await orderService.bulkUpdateOrderStatus(input);

      expect(result.message).toBe('Successfully updated 2 orders (1 orders were not updated - may be cancelled/refunded)');
    });

    it('should throw error if no orders updated', async () => {
      const mockUpdateMany = {
        matchedCount: 0,
        modifiedCount: 0,
      };

      Order.updateMany = vi.fn().mockResolvedValue(mockUpdateMany);

      const input: BulkUpdateOrderStatusInput = {
        orderIds: ['507f1f77bcf86cd799439011'],
        status: 'completed',
      };

      await expect(orderService.bulkUpdateOrderStatus(input))
        .rejects.toThrow(new AppError('No orders were updated', 404));
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
        }
      ];

      Order.aggregate = vi.fn().mockResolvedValue(mockStats);

      const input: GetOrderStatsInput = {
        dateFrom: '2024-01-01T00:00:00.000Z',
        dateTo: '2024-01-31T23:59:59.999Z',
      };

      const result = await orderService.getOrderStats(input);

      expect(result).toEqual({
        totalOrders: 100,
        totalRevenue: 10000,
        averageOrderValue: 100,
        statusBreakdown: {
          completed: 70,
          pending: 20,
          cancelled: 8,
          refunded: 2,
        },
        revenueByDay: mockStats[0].revenueByDay,
        topProducts: mockStats[0].topProducts,
      });

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
        }
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