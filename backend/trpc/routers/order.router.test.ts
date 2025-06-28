import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { orderRouter } from './order.router.js';
import { orderService } from '../../services/order.service.js';
import { TRPCError } from '@trpc/server';
import { AppError } from '../../utils/AppError.js';
import type { inferProcedureInput } from '@trpc/server';
import mongoose from 'mongoose';

vi.mock('../../services/order.service.js');

type OrderRouterInput<T extends keyof typeof orderRouter._def.procedures> = 
  inferProcedureInput<typeof orderRouter._def.procedures[T]>;

describe('Order Router', () => {
  const mockContext = {
    user: {
      _id: new mongoose.Types.ObjectId(),
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
    },
  };

  const mockCaller = orderRouter.createCaller(mockContext as any);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listAll', () => {
    it('should call orderService.listAllOrders with correct parameters', async () => {
      const mockResponse = {
        orders: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 0,
      };

      (orderService.listAllOrders as Mock).mockResolvedValue(mockResponse);

      const input: OrderRouterInput<'listAll'> = {
        page: 1,
        limit: 20,
        status: 'all',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const result = await mockCaller.listAll(input);

      expect(result).toEqual(mockResponse);
      expect(orderService.listAllOrders).toHaveBeenCalledWith(input);
    });

    it('should handle service errors', async () => {
      (orderService.listAllOrders as Mock).mockRejectedValue(new Error('Database error'));

      await expect(mockCaller.listAll({}))
        .rejects.toThrow(TRPCError);
    });

    it('should validate input parameters', async () => {
      const invalidInput = {
        page: -1,
        limit: 200,
      };

      await expect(mockCaller.listAll(invalidInput as any))
        .rejects.toThrow();
    });

    it('should use default values when not provided', async () => {
      const mockResponse = {
        orders: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 0,
      };

      (orderService.listAllOrders as Mock).mockResolvedValue(mockResponse);

      await mockCaller.listAll({});

      expect(orderService.listAllOrders).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        status: 'all',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
    });
  });

  describe('getById', () => {
    it('should return order by ID', async () => {
      const mockOrder = {
        _id: new mongoose.Types.ObjectId(),
        user: { _id: new mongoose.Types.ObjectId(), email: 'user@example.com' },
        products: [],
        totalAmount: 100,
        status: 'completed',
      };

      (orderService.getOrderById as Mock).mockResolvedValue(mockOrder);

      const input: OrderRouterInput<'getById'> = {
        orderId: '507f1f77bcf86cd799439011',
      };

      const result = await mockCaller.getById(input);

      expect(result).toEqual(mockOrder);
      expect(orderService.getOrderById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should handle order not found', async () => {
      (orderService.getOrderById as Mock).mockRejectedValue(new AppError('Order not found', 404));

      const input: OrderRouterInput<'getById'> = {
        orderId: '507f1f77bcf86cd799439011',
      };

      try {
        await mockCaller.getById(input);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe('NOT_FOUND');
        expect((error as TRPCError).message).toBe('Order not found');
      }
    });

    it('should handle generic errors', async () => {
      (orderService.getOrderById as Mock).mockRejectedValue(new Error('Database error'));

      const input: OrderRouterInput<'getById'> = {
        orderId: '507f1f77bcf86cd799439011',
      };

      try {
        await mockCaller.getById(input);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe('INTERNAL_SERVER_ERROR');
      }
    });
  });

  describe('updateStatus', () => {
    it('should update order status successfully', async () => {
      const mockOrder = {
        _id: new mongoose.Types.ObjectId(),
        status: 'completed',
      };

      (orderService.updateOrderStatus as Mock).mockResolvedValue(mockOrder);

      const input: OrderRouterInput<'updateStatus'> = {
        orderId: '507f1f77bcf86cd799439011',
        status: 'completed',
      };

      const result = await mockCaller.updateStatus(input);

      expect(result).toEqual({
        success: true,
        message: 'Order status updated successfully',
        order: mockOrder,
      });
      expect(orderService.updateOrderStatus).toHaveBeenCalledWith(input);
    });

    it('should handle order not found', async () => {
      (orderService.updateOrderStatus as Mock).mockRejectedValue(new AppError('Order not found', 404));

      const input: OrderRouterInput<'updateStatus'> = {
        orderId: '507f1f77bcf86cd799439011',
        status: 'completed',
      };

      try {
        await mockCaller.updateStatus(input);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe('NOT_FOUND');
      }
    });

    it('should handle invalid status transition', async () => {
      (orderService.updateOrderStatus as Mock).mockRejectedValue(
        new AppError('Cannot change status from cancelled to completed', 400)
      );

      const input: OrderRouterInput<'updateStatus'> = {
        orderId: '507f1f77bcf86cd799439011',
        status: 'completed',
      };

      try {
        await mockCaller.updateStatus(input);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe('BAD_REQUEST');
      }
    });
  });

  describe('bulkUpdateStatus', () => {
    it('should update multiple order statuses successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Successfully updated 3 orders',
        matchedCount: 3,
        modifiedCount: 3,
      };

      (orderService.bulkUpdateOrderStatus as Mock).mockResolvedValue(mockResponse);

      const input: OrderRouterInput<'bulkUpdateStatus'> = {
        orderIds: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
        status: 'completed',
      };

      const result = await mockCaller.bulkUpdateStatus(input);

      expect(result).toEqual(mockResponse);
      expect(orderService.bulkUpdateOrderStatus).toHaveBeenCalledWith(input);
    });

    it('should handle no orders updated', async () => {
      (orderService.bulkUpdateOrderStatus as Mock).mockRejectedValue(
        new AppError('No orders were updated', 404)
      );

      const input: OrderRouterInput<'bulkUpdateStatus'> = {
        orderIds: ['507f1f77bcf86cd799439011'],
        status: 'completed',
      };

      try {
        await mockCaller.bulkUpdateStatus(input);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe('NOT_FOUND');
      }
    });

    it('should validate empty array', async () => {
      const input = {
        orderIds: [],
        status: 'completed',
      };

      await expect(mockCaller.bulkUpdateStatus(input as any))
        .rejects.toThrow();
    });
  });

  describe('getStats', () => {
    it('should return order statistics', async () => {
      const mockStats = {
        totalOrders: 100,
        totalRevenue: 10000,
        averageOrderValue: 100,
        statusBreakdown: {
          pending: 20,
          completed: 70,
          cancelled: 8,
          refunded: 2,
        },
        revenueByDay: [],
        topProducts: [],
      };

      (orderService.getOrderStats as Mock).mockResolvedValue(mockStats);

      const input: OrderRouterInput<'getStats'> = {
        dateFrom: '2024-01-01T00:00:00.000Z',
        dateTo: '2024-01-31T23:59:59.999Z',
      };

      const result = await mockCaller.getStats(input);

      expect(result).toEqual(mockStats);
      expect(orderService.getOrderStats).toHaveBeenCalledWith(input);
    });

    it('should handle stats without date filter', async () => {
      const mockStats = {
        totalOrders: 1000,
        totalRevenue: 100000,
        averageOrderValue: 100,
        statusBreakdown: {
          pending: 200,
          completed: 700,
          cancelled: 80,
          refunded: 20,
        },
        revenueByDay: [],
        topProducts: [],
      };

      (orderService.getOrderStats as Mock).mockResolvedValue(mockStats);

      const result = await mockCaller.getStats({});

      expect(result).toEqual(mockStats);
      expect(orderService.getOrderStats).toHaveBeenCalledWith({});
    });

    it('should handle service errors', async () => {
      (orderService.getOrderStats as Mock).mockRejectedValue(new Error('Database error'));

      await expect(mockCaller.getStats({}))
        .rejects.toThrow(TRPCError);
    });
  });

  describe('Authorization', () => {
    it('should require admin role for all procedures', async () => {
      const nonAdminContext = {
        user: {
          _id: new mongoose.Types.ObjectId(),
          email: 'user@example.com',
          name: 'Regular User',
          role: 'user',
        },
      };

      const nonAdminCaller = orderRouter.createCaller(nonAdminContext as any);

      await expect(nonAdminCaller.listAll({}))
        .rejects.toThrow();

      await expect(nonAdminCaller.getById({ orderId: '507f1f77bcf86cd799439011' }))
        .rejects.toThrow();

      await expect(nonAdminCaller.updateStatus({ orderId: '507f1f77bcf86cd799439011', status: 'completed' }))
        .rejects.toThrow();

      await expect(nonAdminCaller.bulkUpdateStatus({ orderIds: ['507f1f77bcf86cd799439011'], status: 'completed' }))
        .rejects.toThrow();

      await expect(nonAdminCaller.getStats({}))
        .rejects.toThrow();
    });
  });

  describe('Customer endpoints', () => {
    const customerContext = {
      user: {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439000'),
        email: 'customer@example.com',
        name: 'Customer User',
        role: 'user',
      },
    };

    const customerCaller = orderRouter.createCaller(customerContext as any);

    describe('listMine', () => {
      it('should return only authenticated user orders', async () => {
        const mockResponse = {
          orders: [],
          totalCount: 0,
          currentPage: 1,
          totalPages: 0,
        };

        (orderService.listAllOrders as Mock).mockResolvedValue(mockResponse);

        const input: OrderRouterInput<'listMine'> = {
          page: 1,
          limit: 10,
          status: 'all',
          sortBy: 'createdAt',
          sortOrder: 'desc',
        };

        const result = await customerCaller.listMine(input);

        expect(result).toEqual(mockResponse);
        expect(orderService.listAllOrders).toHaveBeenCalledWith({
          ...input,
          userId: '507f1f77bcf86cd799439000'
        });
      });

      it('should ignore search parameter if provided', async () => {
        const mockResponse = {
          orders: [],
          totalCount: 0,
          currentPage: 1,
          totalPages: 0,
        };

        (orderService.listAllOrders as Mock).mockResolvedValue(mockResponse);

        const inputWithSearch = {
          page: 1,
          limit: 10,
          search: 'test@example.com',
        };

        await customerCaller.listMine(inputWithSearch as any);

        // Verify search was not passed to the service
        expect(orderService.listAllOrders).toHaveBeenCalledWith({
          page: 1,
          limit: 10,
          status: 'all',
          sortBy: 'createdAt',
          sortOrder: 'desc',
          userId: '507f1f77bcf86cd799439000'
        });
        
        // Note: search parameter should NOT be in the call
        const lastCall = (orderService.listAllOrders as Mock).mock.lastCall?.[0];
        expect(lastCall).toBeDefined();
        expect(lastCall).not.toHaveProperty('search');
      });

      it('should respect pagination parameters', async () => {
        const mockResponse = {
          orders: [],
          totalCount: 50,
          currentPage: 2,
          totalPages: 5,
        };

        (orderService.listAllOrders as Mock).mockResolvedValue(mockResponse);

        const input: OrderRouterInput<'listMine'> = {
          page: 2,
          limit: 10,
        };

        await customerCaller.listMine(input);

        expect(orderService.listAllOrders).toHaveBeenCalledWith({
          page: 2,
          limit: 10,
          status: 'all',
          sortBy: 'createdAt',
          sortOrder: 'desc',
          userId: '507f1f77bcf86cd799439000'
        });
      });

      it('should throw UNAUTHORIZED for unauthenticated requests', async () => {
        const unauthCaller = orderRouter.createCaller({ user: null } as any);

        await expect(unauthCaller.listMine({}))
          .rejects.toThrow(TRPCError);
      });

      it('should return empty list for user with no orders', async () => {
        const mockResponse = {
          orders: [],
          totalCount: 0,
          currentPage: 1,
          totalPages: 0,
        };

        (orderService.listAllOrders as Mock).mockResolvedValue(mockResponse);

        const result = await customerCaller.listMine({});

        expect(result).toEqual(mockResponse);
      });
    });

    describe('getMine', () => {
      it('should return order details for owned order', async () => {
        const mockOrder = {
          _id: '507f1f77bcf86cd799439011',
          user: { _id: '507f1f77bcf86cd799439000', email: 'customer@example.com' },
          products: [],
          totalAmount: 100,
          status: 'completed',
        };

        (orderService.getOrderById as Mock).mockResolvedValue(mockOrder);

        const input: OrderRouterInput<'getMine'> = {
          orderId: '507f1f77bcf86cd799439011',
        };

        const result = await customerCaller.getMine(input);

        expect(result).toEqual(mockOrder);
        expect(orderService.getOrderById).toHaveBeenCalledWith(
          '507f1f77bcf86cd799439011',
          '507f1f77bcf86cd799439000'
        );
      });

      it('should throw NOT_FOUND for non-existent order', async () => {
        (orderService.getOrderById as Mock).mockRejectedValue(new AppError('Order not found', 404));

        const input: OrderRouterInput<'getMine'> = {
          orderId: '507f1f77bcf86cd799439011',
        };

        try {
          await customerCaller.getMine(input);
          expect.fail('Should have thrown error');
        } catch (error) {
          expect(error).toBeInstanceOf(TRPCError);
          expect((error as TRPCError).code).toBe('NOT_FOUND');
          expect((error as TRPCError).message).toBe('Order not found or access denied');
        }
      });

      it('should throw NOT_FOUND for order owned by different user', async () => {
        (orderService.getOrderById as Mock).mockRejectedValue(new AppError('Order not found', 404));

        const input: OrderRouterInput<'getMine'> = {
          orderId: '507f1f77bcf86cd799439011',
        };

        try {
          await customerCaller.getMine(input);
          expect.fail('Should have thrown error');
        } catch (error) {
          expect(error).toBeInstanceOf(TRPCError);
          expect((error as TRPCError).code).toBe('NOT_FOUND');
          expect((error as TRPCError).message).toBe('Order not found or access denied');
        }
      });

      it('should throw UNAUTHORIZED for unauthenticated requests', async () => {
        const unauthCaller = orderRouter.createCaller({ user: null } as any);

        await expect(unauthCaller.getMine({ orderId: '507f1f77bcf86cd799439011' }))
          .rejects.toThrow(TRPCError);
      });

      it('should include populated product and user data', async () => {
        const mockOrder = {
          _id: '507f1f77bcf86cd799439011',
          user: { 
            _id: '507f1f77bcf86cd799439000', 
            email: 'customer@example.com',
            name: 'Customer User'
          },
          products: [
            {
              product: {
                _id: '507f1f77bcf86cd799439012',
                name: 'Test Product',
                image: 'test.jpg'
              },
              quantity: 2,
              price: 50
            }
          ],
          totalAmount: 100,
          status: 'completed',
        };

        (orderService.getOrderById as Mock).mockResolvedValue(mockOrder);

        const result = await customerCaller.getMine({ orderId: '507f1f77bcf86cd799439011' });

        expect(result.products[0].product.name).toBe('Test Product');
        expect(result.user.email).toBe('customer@example.com');
      });
    });

    describe('Customer data isolation', () => {
      it('should prevent customer A from accessing customer B orders via listMine', async () => {
        const customerA = new mongoose.Types.ObjectId('507f1f77bcf86cd799439001');

        const customerAContext = {
          user: {
            _id: customerA,
            email: 'customerA@example.com',
            name: 'Customer A',
            role: 'user',
          },
        };

        const customerACaller = orderRouter.createCaller(customerAContext as any);

        await customerACaller.listMine({});

        // Verify that listAllOrders was called with customerA's ID
        expect(orderService.listAllOrders).toHaveBeenCalledWith({
          page: 1,
          limit: 10,
          status: 'all',
          sortBy: 'createdAt',
          sortOrder: 'desc',
          userId: customerA.toString()
        });
      });

      it('should prevent customer from accessing other customer order via getMine', async () => {
        // Customer B's order
        (orderService.getOrderById as Mock).mockRejectedValue(new AppError('Order not found', 404));

        const input: OrderRouterInput<'getMine'> = {
          orderId: '507f1f77bcf86cd799439011',
        };

        try {
          await customerCaller.getMine(input);
          expect.fail('Should have thrown error');
        } catch (error) {
          expect(error).toBeInstanceOf(TRPCError);
          expect((error as TRPCError).code).toBe('NOT_FOUND');
        }
      });

      it('should require authentication for customer endpoints', async () => {
        const unauthCaller = orderRouter.createCaller({ user: null } as any);

        await expect(unauthCaller.listMine({}))
          .rejects.toThrow(TRPCError);

        await expect(unauthCaller.getMine({ orderId: '507f1f77bcf86cd799439011' }))
          .rejects.toThrow(TRPCError);
      });
    });
  });
});