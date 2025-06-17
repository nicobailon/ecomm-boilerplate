import { router, protectedProcedure } from '../index.js';
import { checkoutSchema, checkoutSuccessSchema } from '../../validations/index.js';
import { paymentService } from '../../services/payment.service.js';
import { TRPCError } from '@trpc/server';

export const paymentRouter = router({
  createCheckout: protectedProcedure
    .input(checkoutSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await paymentService.createCheckoutSession(
          ctx.user,
          input.products,
          input.couponCode
        );
      } catch (error: any) {
        if (error.statusCode === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to create checkout session',
        });
      }
    }),
    
  checkoutSuccess: protectedProcedure
    .input(checkoutSuccessSchema)
    .mutation(async ({ input }) => {
      try {
        return await paymentService.processCheckoutSuccess(input.sessionId);
      } catch (error: any) {
        if (error.statusCode === 400) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to process checkout success',
        });
      }
    }),
});