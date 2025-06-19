import { router, protectedProcedure } from '../index.js';
import { checkoutSchema, checkoutSuccessSchema } from '../../validations/index.js';
import { paymentService } from '../../services/payment.service.js';
import { TRPCError } from '@trpc/server';
import { isAppError } from '../../utils/error-types.js';

export const paymentRouter = router({
  createCheckout: protectedProcedure
    .input(checkoutSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await paymentService.createCheckoutSession(
          ctx.user,
          input.products,
          input.couponCode,
        );
      } catch (error) {
        if (isAppError(error) && error.statusCode === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }
        const message = error instanceof Error ? error.message : 'Failed to create checkout session';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to create checkout session',
        });
      }
    }),
    
  checkoutSuccess: protectedProcedure
    .input(checkoutSuccessSchema)
    .mutation(async ({ input }) => {
      try {
        return await paymentService.processCheckoutSuccess(input.sessionId);
      } catch (error) {
        if (isAppError(error) && error.statusCode === 400) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }
        const message = error instanceof Error ? error.message : 'Failed to process checkout success';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to process checkout success',
        });
      }
    }),
});