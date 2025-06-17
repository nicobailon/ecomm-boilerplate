import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { analyticsService } from '../services/analytics.service.js';






export const getAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const analyticsData = await analyticsService.getAnalyticsData();
  res.json(analyticsData);
});

export const getDailySales = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  
  const dailySalesData = await analyticsService.getDailySalesData(
    startDate as string | undefined,
    endDate as string | undefined
  );
  
  res.json(dailySalesData);
});
