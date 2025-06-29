import { router, protectedProcedure, adminProcedure } from '../index.js';
import { z } from 'zod';
import { checkoutSchema, checkoutSuccessSchema } from '../../validations/index.js';
import { paymentService } from '../../services/payment.service.js';
import { webhookService } from '../../services/webhook.service.js';
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
    
  retryWebhooks: adminProcedure
    .input(z.object({
      maxAttempts: z.number().int().min(1).max(10).optional().default(3),
      olderThanHours: z.number().int().min(1).max(168).optional().default(24), // max 7 days
    }).optional())
    .mutation(async ({ input }) => {
      try {
        const olderThan = new Date(Date.now() - (input?.olderThanHours ?? 24) * 60 * 60 * 1000);
        const result = await webhookService.retryFailedEvents(
          input?.maxAttempts ?? 3,
          olderThan
        );
        
        return {
          success: true,
          message: 'Failed webhook retry process completed',
          processed: result.processed,
          failed: result.failed,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to retry webhooks';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to retry webhooks',
        });
      }
    }),
});