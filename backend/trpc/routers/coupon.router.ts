import { router, protectedProcedure } from '../index.js';
import { applyCouponSchema } from '../../validations/index.js';
import { couponService } from '../../services/coupon.service.js';
import { cartService } from '../../services/cart.service.js';
import { TRPCError } from '@trpc/server';

export const couponRouter = router({
  getMyCoupon: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        return await couponService.getCoupon((ctx.user as any)._id.toString());
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to get coupon',
        });
      }
    }),
    
  validate: protectedProcedure
    .input(applyCouponSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await couponService.validateCoupon((ctx.user as any)._id.toString(), input.code);
      } catch (error: any) {
        if (error.statusCode === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to validate coupon',
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
          message: "Coupon applied successfully",
          cart
        };
      } catch (error: any) {
        if (error.statusCode === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to apply coupon',
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
          message: "Coupon removed successfully",
          cart
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to remove coupon',
        });
      }
    }),
});