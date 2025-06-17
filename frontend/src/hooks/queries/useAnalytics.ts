import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { AnalyticsData, DailySalesData } from '@/types';

interface AnalyticsResponse {
  analyticsData: AnalyticsData;
  dailySalesData: DailySalesData[];
}

export const useAnalytics = () => {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const { data } = await apiClient.get<AnalyticsResponse>('/analytics');
      return data;
    },
  });
};