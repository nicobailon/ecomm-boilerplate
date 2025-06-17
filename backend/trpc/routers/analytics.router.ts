import { router, adminProcedure } from '../index.js';
import { analyticsService } from '../../services/analytics.service.js';
import { dateRangeSchema } from '../../validations/index.js';
import { TRPCError } from '@trpc/server';

export const analyticsRouter = router({
  overview: adminProcedure
    .query(async () => {
      try {
        return await analyticsService.getAnalyticsData();
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to get analytics data',
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
      } catch (error: any) {
        if (error.statusCode === 400 || error.code === 'BAD_REQUEST') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to get daily sales data',
        });
      }
    }),
});