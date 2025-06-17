import { router, protectedProcedure } from '../index.js';
import { applyCouponSchema } from '../../validations/index.js';
import { couponService } from '../../services/coupon.service.js';
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
});