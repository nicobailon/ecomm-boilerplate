import { FEATURE_FLAGS } from '@/lib/feature-flags';
import { trpc } from '@/lib/trpc';
import { useApplyCoupon as useApplyCouponREST, useRemoveCoupon as useRemoveCouponREST } from '@/hooks/cart/useCart';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

export function useApplyCoupon() {
  const restMutation = useApplyCouponREST();
  const queryClient = useQueryClient();
  
  const trpcMutation = trpc.coupon.applyCoupon.useMutation({
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
      if (data.cart) {
        queryClient.setQueryData(['cart'], data.cart);
      }
      toast.success(data.message || 'Coupon applied successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to apply coupon');
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
  const queryClient = useQueryClient();
  
  const trpcMutation = trpc.coupon.removeCoupon.useMutation({
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
      if (data.cart) {
        queryClient.setQueryData(['cart'], data.cart);
      }
      toast.success(data.message || 'Coupon removed successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove coupon');
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

