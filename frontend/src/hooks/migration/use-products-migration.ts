import { FEATURE_FLAGS } from '@/lib/feature-flags';
import { trpc } from '@/lib/trpc';
import { 
  useProducts as useProductsREST, 
  useFeaturedProducts as useFeaturedProductsREST,
  useCreateProduct as useCreateProductREST,
  useUpdateProduct as useUpdateProductREST,
  useDeleteProduct as useDeleteProductREST,
  useToggleFeatured as useToggleFeaturedREST,
  useProductRecommendations as useProductRecommendationsREST
} from '@/hooks/product/useProducts';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Product, ApiResponse } from '@/types';
import { apiClient } from '@/lib/api-client';

export function useProducts(page = 1, limit = 12, search?: string) {
  const restQuery = useProductsREST(page, limit);
  const trpcQuery = trpc.product.list.useQuery(
    { page, limit, search },
    { enabled: FEATURE_FLAGS.USE_TRPC_PRODUCTS }
  );

  if (FEATURE_FLAGS.USE_TRPC_PRODUCTS) {
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

export function useFeaturedProducts() {
  const restQuery = useFeaturedProductsREST();
  const trpcQuery = trpc.product.featured.useQuery(undefined, {
    enabled: FEATURE_FLAGS.USE_TRPC_PRODUCTS,
  });

  if (FEATURE_FLAGS.USE_TRPC_PRODUCTS) {
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

export function useProductById(id: string) {
  // REST implementation - create inline since it doesn't exist in the original hooks
  const restQuery = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
      return data.data;
    },
    enabled: !!id && !FEATURE_FLAGS.USE_TRPC_PRODUCTS,
  });

  const trpcQuery = trpc.product.byId.useQuery(id, {
    enabled: FEATURE_FLAGS.USE_TRPC_PRODUCTS && !!id,
  });

  if (FEATURE_FLAGS.USE_TRPC_PRODUCTS) {
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

export function useCreateProduct() {
  const restMutation = useCreateProductREST();
  const queryClient = useQueryClient();
  
  const trpcMutation = trpc.product.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
    },
  });

  if (FEATURE_FLAGS.USE_TRPC_PRODUCTS) {
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

export function useUpdateProduct() {
  const restMutation = useUpdateProductREST();
  const queryClient = useQueryClient();
  
  const trpcMutation = trpc.product.update.useMutation({
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
      toast.success('Product updated successfully');
    },
  });

  if (FEATURE_FLAGS.USE_TRPC_PRODUCTS) {
    return {
      mutate: (params: { id: string; data: any }) => trpcMutation.mutate(params),
      mutateAsync: (params: { id: string; data: any }) => trpcMutation.mutateAsync(params),
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

export function useDeleteProduct() {
  const restMutation = useDeleteProductREST();
  const queryClient = useQueryClient();
  
  const trpcMutation = trpc.product.delete.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
    },
  });

  if (FEATURE_FLAGS.USE_TRPC_PRODUCTS) {
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

export function useToggleFeatured() {
  const restMutation = useToggleFeaturedREST();
  const queryClient = useQueryClient();
  
  const trpcMutation = trpc.product.toggleFeatured.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated');
    },
  });

  if (FEATURE_FLAGS.USE_TRPC_PRODUCTS) {
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

export function useProductRecommendations() {
  const restQuery = useProductRecommendationsREST();
  const trpcQuery = trpc.product.recommended.useQuery(undefined, {
    enabled: FEATURE_FLAGS.USE_TRPC_PRODUCTS,
  });

  if (FEATURE_FLAGS.USE_TRPC_PRODUCTS) {
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

