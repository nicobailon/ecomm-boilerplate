import { FEATURE_FLAGS } from '@/lib/feature-flags';
import { trpc } from '@/lib/trpc';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

interface CheckoutProduct {
  _id: string;
  quantity: number;
  price: number;
}

export function useCreateCheckoutSession() {
  // REST implementation
  const restMutation = useMutation({
    mutationFn: async ({ products, couponCode }: { 
      products: CheckoutProduct[]; 
      couponCode?: string | null;
    }) => {
      const { data } = await apiClient.post('/payments/create-checkout-session', {
        products,
        couponCode,
      });
      return data;
    },
  });
  
  const trpcMutation = trpc.payment.createCheckout.useMutation();

  if (FEATURE_FLAGS.USE_TRPC_PAYMENT) {
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

export function useCheckoutSuccess() {
  // REST implementation
  const restMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { data } = await apiClient.post('/payments/checkout-success', { sessionId });
      return data;
    },
    onSuccess: () => {
      toast.success('Payment successful! Order created.');
    },
  });
  
  const trpcMutation = trpc.payment.checkoutSuccess.useMutation({
    onSuccess: () => {
      toast.success('Payment successful! Order created.');
    },
  });

  if (FEATURE_FLAGS.USE_TRPC_PAYMENT) {
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