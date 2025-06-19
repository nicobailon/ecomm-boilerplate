import { router, adminProcedure } from '../index.js';
import { analyticsService } from '../../services/analytics.service.js';
import { dateRangeSchema } from '../../validations/index.js';
import { TRPCError } from '@trpc/server';
import { isAppError } from '../../utils/error-types.js';

export const analyticsRouter = router({
  overview: adminProcedure
    .query(async () => {
      try {
        return await analyticsService.getAnalyticsData();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get analytics data';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to get analytics data',
        });
      }
    }),
    
  dailySales: adminProcedure
    .input(dateRangeSchema.optional())
    .query(async ({ input }) => {
      try {
        if (!input?.startDate || !input?.endDate) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Start date and end date are required',
          });
        }
        return await analyticsService.getDailySalesData(input.startDate, input.endDate);
      } catch (error) {
        if (isAppError(error) && (error.statusCode === 400 || error.code === 'BAD_REQUEST')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }
        const message = error instanceof Error ? error.message : 'Failed to get daily sales data';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to get daily sales data',
        });
      }
    }),
});