import { FEATURE_FLAGS } from '@/lib/feature-flags';
import { trpc } from '@/lib/trpc';
import { 
  useCart as useCartREST, 
  useAddToCart as useAddToCartREST,
  useUpdateQuantity as useUpdateQuantityREST,
  useRemoveFromCart as useRemoveFromCartREST,
} from '@/hooks/cart/useCart';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Product } from '@/types';
import { apiClient } from '@/lib/api-client';

export function useCart() {
  const restQuery = useCartREST();
  const trpcQuery = trpc.cart.get.useQuery(undefined, {
    enabled: FEATURE_FLAGS.USE_TRPC_CART,
  });

  if (FEATURE_FLAGS.USE_TRPC_CART) {
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

export function useAddToCart() {
  const restMutation = useAddToCartREST();
  const queryClient = useQueryClient();
  
  const trpcMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Added to cart');
    },
    onError: () => {
      toast.error('Failed to add to cart');
    },
  });

  if (FEATURE_FLAGS.USE_TRPC_CART) {
    return {
      mutate: (product: Product | string) => {
        const productId = typeof product === 'string' ? product : product._id;
        trpcMutation.mutate({ productId });
      },
      mutateAsync: async (product: Product | string) => {
        const productId = typeof product === 'string' ? product : product._id;
        return trpcMutation.mutateAsync({ productId });
      },
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

export function useUpdateQuantity() {
  const restMutation = useUpdateQuantityREST();
  const queryClient = useQueryClient();
  
  const trpcMutation = trpc.cart.updateQuantity.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  if (FEATURE_FLAGS.USE_TRPC_CART) {
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

export function useRemoveFromCart() {
  const restMutation = useRemoveFromCartREST();
  const queryClient = useQueryClient();
  
  const trpcMutation = trpc.cart.remove.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Removed from cart');
    },
  });

  if (FEATURE_FLAGS.USE_TRPC_CART) {
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

export function useClearCart() {
  const queryClient = useQueryClient();
  
  // REST implementation - inline since it doesn't exist in the original hooks
  const restMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete('/cart');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Cart cleared');
    },
  });
  
  const trpcMutation = trpc.cart.clear.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Cart cleared');
    },
  });

  if (FEATURE_FLAGS.USE_TRPC_CART) {
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

