import { router, protectedProcedure, adminProcedure } from '../index.js';
import { 
  applyCouponSchema, 
  createDiscountSchema, 
  updateDiscountSchema, 
  listDiscountsSchema, 
  deleteDiscountSchema 
} from '../../validations/index.js';
import { couponService } from '../../services/coupon.service.js';
import { cartService } from '../../services/cart.service.js';
import { TRPCError } from '@trpc/server';
import { isAppError } from '../../utils/error-types.js';
import mongoose from 'mongoose';

export const couponRouter = router({
  getMyCoupon: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        return await couponService.getCoupon((ctx.user._id as mongoose.Types.ObjectId).toString());
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get coupon';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to get coupon',
        });
      }
    }),
    
  validate: protectedProcedure
    .input(applyCouponSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await couponService.validateCoupon((ctx.user._id as mongoose.Types.ObjectId).toString(), input.code);
      } catch (error) {
        if (isAppError(error) && error.statusCode === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }
        const message = error instanceof Error ? error.message : 'Failed to validate coupon';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to validate coupon',
        });
      }
    }),

  applyCoupon: protectedProcedure
    .input(applyCouponSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        await couponService.applyCouponToUser(ctx.user, input.code);
        const cart = await cartService.calculateCartTotals(ctx.user);
        
        return {
          success: true,
          message: 'Coupon applied successfully',
          cart,
        };
      } catch (error) {
        if (isAppError(error) && error.statusCode === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }
        const message = error instanceof Error ? error.message : 'Failed to apply coupon';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to apply coupon',
        });
      }
    }),

  removeCoupon: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        await couponService.removeCouponFromUser(ctx.user);
        const cart = await cartService.calculateCartTotals(ctx.user);
        
        return {
          success: true,
          message: 'Coupon removed successfully',
          cart,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to remove coupon';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to remove coupon',
        });
      }
    }),

  // Admin procedures
  listAll: adminProcedure
    .input(listDiscountsSchema)
    .query(async ({ input }) => {
      try {
        return await couponService.listAllDiscounts(input);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch discounts',
        });
      }
    }),

  create: adminProcedure
    .input(createDiscountSchema)
    .mutation(async ({ input }) => {
      try {
        return await couponService.createDiscount(input);
      } catch (error) {
        if (isAppError(error) && error.statusCode === 409) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create discount',
        });
      }
    }),

  update: adminProcedure
    .input(updateDiscountSchema)
    .mutation(async ({ input }) => {
      try {
        return await couponService.updateDiscount(input.id, input.data);
      } catch (error) {
        if (isAppError(error) && error.statusCode === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update discount',
        });
      }
    }),

  delete: adminProcedure
    .input(deleteDiscountSchema)
    .mutation(async ({ input }) => {
      try {
        return await couponService.deleteDiscount(input.id);
      } catch (error) {
        if (isAppError(error) && error.statusCode === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete discount',
        });
      }
    }),
});