import { router, adminProcedure, protectedProcedure } from '../index.js';
import { TRPCError } from '@trpc/server';
import { isAppError } from '../../utils/error-types.js';
import { 
  listOrdersSchema,
  updateOrderStatusSchema,
  bulkUpdateOrderStatusSchema,
  getOrderByIdSchema,
  getOrderStatsSchema,
} from '../../validations/order.validation.js';
import { orderService } from '../../services/order.service.js';

export const orderRouter = router({
  listAll: adminProcedure
    .input(listOrdersSchema)
    .query(async ({ input }) => {
      try {
        return await orderService.listAllOrders(input);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch orders',
        });
      }
    }),

  getById: adminProcedure
    .input(getOrderByIdSchema)
    .query(async ({ input }) => {
      try {
        return await orderService.getOrderById(input.orderId);
      } catch (error) {
        if (isAppError(error) && error.statusCode === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch order',
        });
      }
    }),

  updateStatus: adminProcedure
    .input(updateOrderStatusSchema)
    .mutation(async ({ input }) => {
      try {
        const order = await orderService.updateOrderStatus(input);
        return {
          success: true,
          message: 'Order status updated successfully',
          order,
        };
      } catch (error) {
        if (isAppError(error)) {
          if (error.statusCode === 404) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: error.message,
            });
          }
          if (error.statusCode === 400) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: error.message,
            });
          }
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update order status',
        });
      }
    }),

  bulkUpdateStatus: adminProcedure
    .input(bulkUpdateOrderStatusSchema)
    .mutation(async ({ input }) => {
      try {
        return await orderService.bulkUpdateOrderStatus(input);
      } catch (error) {
        if (isAppError(error) && error.statusCode === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update orders',
        });
      }
    }),

  getStats: adminProcedure
    .input(getOrderStatsSchema)
    .query(async ({ input }) => {
      try {
        return await orderService.getOrderStats(input);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch order statistics',
        });
      }
    }),

  // Customer endpoints
  listMine: protectedProcedure
    .input(listOrdersSchema.omit({ search: true }))
    .query(async ({ input, ctx }) => {
      try {
        return await orderService.listAllOrders({
          ...input,
          userId: ctx.user._id.toString(),
        });
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch orders',
        });
      }
    }),

  getMine: protectedProcedure
    .input(getOrderByIdSchema)
    .query(async ({ input, ctx }) => {
      try {
        return await orderService.getOrderById(input.orderId, ctx.user._id.toString());
      } catch (error) {
        if (isAppError(error) && error.statusCode === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Order not found or access denied',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch order',
        });
      }
    }),
});