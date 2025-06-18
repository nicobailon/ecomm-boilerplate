import { FEATURE_FLAGS } from '@/lib/feature-flags';
import { trpc } from '@/lib/trpc';
import { useApplyCoupon as useApplyCouponREST, useRemoveCoupon as useRemoveCouponREST } from '@/hooks/cart/useCart';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

export function useApplyCoupon() {
  const restMutation = useApplyCouponREST();
  const queryClient = useQueryClient();
  
  const trpcMutation = trpc.coupon.validate.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Coupon applied successfully');
    },
  });

  if (FEATURE_FLAGS.USE_TRPC_COUPONS) {
    return {
      mutate: trpcMutation.mutate,
      mutateAsync: trpcMutation.mutateAsync,
      isLoading: trpcMutation.isPending,
      isError: trpcMutation.isError,
      error: trpcMutation.error,
      data: trpcMutation.data,
      isPending: trpcMutation.isPending,
      isSuccess: trpcMutation.isSuccess,
    };
  }

  return restMutation;
}

export function useRemoveCoupon() {
  const restMutation = useRemoveCouponREST();
  
  // tRPC doesn't have a remove coupon endpoint, so we'll use REST for now
  if (FEATURE_FLAGS.USE_TRPC_COUPONS) {
    return restMutation;
  }

  return restMutation;
}

export function useGetMyCoupon() {
  // REST implementation - inline since it doesn't exist in the original hooks
  const restQuery = useQuery({
    queryKey: ['coupon', 'my-coupon'],
    queryFn: async () => {
      const { data } = await apiClient.get('/coupons/my-coupon');
      return data;
    },
    enabled: !FEATURE_FLAGS.USE_TRPC_COUPONS,
  });
  
  const trpcQuery = trpc.coupon.getMyCoupon.useQuery(undefined, {
    enabled: FEATURE_FLAGS.USE_TRPC_COUPONS,
  });

  if (FEATURE_FLAGS.USE_TRPC_COUPONS) {
    return {
      data: trpcQuery.data,
      isLoading: trpcQuery.isLoading,
      error: trpcQuery.error,
      isError: trpcQuery.isError,
      refetch: trpcQuery.refetch,
    };
  }

  return restQuery;
}

