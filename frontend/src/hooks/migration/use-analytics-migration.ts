import { FEATURE_FLAGS } from '@/lib/feature-flags';
import { trpc } from '@/lib/trpc';
import { useAnalytics as useAnalyticsREST } from '@/hooks/analytics/useAnalytics';

export function useAnalytics() {
  const restQuery = useAnalyticsREST();
  
  // Since tRPC splits analytics into two endpoints, we'll need to combine them
  const overviewQuery = trpc.analytics.overview.useQuery(undefined, {
    enabled: FEATURE_FLAGS.USE_TRPC_ANALYTICS,
  });
  
  const dailySalesQuery = trpc.analytics.dailySales.useQuery(undefined, {
    enabled: FEATURE_FLAGS.USE_TRPC_ANALYTICS,
  });

  if (FEATURE_FLAGS.USE_TRPC_ANALYTICS) {
    // Combine the data from both queries to match REST API structure
    const isLoading = overviewQuery.isLoading || dailySalesQuery.isLoading;
    const isError = overviewQuery.isError || dailySalesQuery.isError;
    const error = overviewQuery.error ?? dailySalesQuery.error;
    
    const data = overviewQuery.data && dailySalesQuery.data ? {
      analyticsData: overviewQuery.data,
      dailySalesData: dailySalesQuery.data,
    } : undefined;

    return {
      data,
      isLoading,
      error,
      isError,
      refetch: async () => {
        await Promise.all([
          overviewQuery.refetch(),
          dailySalesQuery.refetch(),
        ]);
      },
    };
  }

  return restQuery;
}

export function useAnalyticsOverview() {
  const restQuery = useAnalyticsREST();
  const trpcQuery = trpc.analytics.overview.useQuery(undefined, {
    enabled: FEATURE_FLAGS.USE_TRPC_ANALYTICS,
  });

  if (FEATURE_FLAGS.USE_TRPC_ANALYTICS) {
    return {
      data: trpcQuery.data,
      isLoading: trpcQuery.isLoading,
      error: trpcQuery.error,
      isError: trpcQuery.isError,
      refetch: trpcQuery.refetch,
    };
  }

  // Extract just the analytics data from REST response
  return {
    data: restQuery.data?.analyticsData,
    isLoading: restQuery.isLoading,
    error: restQuery.error,
    isError: restQuery.isError,
    refetch: restQuery.refetch,
  };
}

export function useDailySales(startDate?: string, endDate?: string) {
  const restQuery = useAnalyticsREST();
  const trpcQuery = trpc.analytics.dailySales.useQuery(
    { startDate, endDate },
    { enabled: FEATURE_FLAGS.USE_TRPC_ANALYTICS },
  );

  if (FEATURE_FLAGS.USE_TRPC_ANALYTICS) {
    return {
      data: trpcQuery.data,
      isLoading: trpcQuery.isLoading,
      error: trpcQuery.error,
      isError: trpcQuery.isError,
      refetch: trpcQuery.refetch,
    };
  }

  // Extract just the daily sales data from REST response
  return {
    data: restQuery.data?.dailySalesData,
    isLoading: restQuery.isLoading,
    error: restQuery.error,
    isError: restQuery.isError,
    refetch: restQuery.refetch,
  };
}