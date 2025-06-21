import { FEATURE_FLAGS } from '@/lib/feature-flags';
import { trpc } from '@/lib/trpc';
import type { ProductInput, ProductFormInput } from '@/lib/validations';
import { 
  useProducts as useProductsREST, 
  useFeaturedProducts as useFeaturedProductsREST,
  useCreateProduct as useCreateProductREST,
  useUpdateProduct as useUpdateProductREST,
  useDeleteProduct as useDeleteProductREST,
  useToggleFeatured as useToggleFeaturedREST,
} from '@/hooks/product/useProducts';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Product, ApiResponse } from '@/types';
import { apiClient } from '@/lib/api-client';

export function useProducts(page = 1, limit = 12, search?: string) {
  const restQuery = useProductsREST(page, limit);
  const trpcQuery = trpc.product.list.useQuery(
    { page, limit, search },
    { enabled: FEATURE_FLAGS.USE_TRPC_PRODUCTS },
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
      if (!data.data) {
        throw new Error('Product not found');
      }
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
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
    },
  });

  if (FEATURE_FLAGS.USE_TRPC_PRODUCTS) {
    return {
      mutate: (data: ProductFormInput | ProductInput) => {
        // Cast to match API expectations
        const apiData = data as Parameters<typeof trpcMutation.mutate>[0];
        trpcMutation.mutate(apiData);
      },
      mutateAsync: async (data: ProductFormInput | ProductInput) => {
        // Cast to match API expectations
        const apiData = data as Parameters<typeof trpcMutation.mutateAsync>[0];
        return trpcMutation.mutateAsync(apiData);
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

export function useUpdateProduct() {
  const restMutation = useUpdateProductREST();
  const queryClient = useQueryClient();
  
  const trpcMutation = trpc.product.update.useMutation({
    onSuccess: (_, variables) => {
      // Invalidate all product-related queries
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
      // Also invalidate featured products in case the update affected that
      void queryClient.invalidateQueries({ queryKey: ['products', 'featured'] });
      
      // Invalidate inventory queries for this product
      void queryClient.invalidateQueries({ 
        queryKey: ['trpc.inventory.getProductInventory'],
        predicate: (query) => {
          const queryKey = query.queryKey as any[];
          return queryKey[3]?.input?.productId === variables.id;
        },
      });
      
      // Invalidate general inventory queries
      void queryClient.invalidateQueries({ queryKey: ['trpc.inventory.getInventoryMetrics'] });
      void queryClient.invalidateQueries({ queryKey: ['trpc.inventory.list'] });
      void queryClient.invalidateQueries({ queryKey: ['trpc.inventory.getLowStockProducts'] });
      
      toast.success('Product updated successfully');
    },
  });

  if (FEATURE_FLAGS.USE_TRPC_PRODUCTS) {
    return {
      mutate: (params: { id: string; data: Partial<ProductFormInput> | Partial<ProductInput> }) => {
        // Transform the data to match API expectations
        const apiData = params.data as Parameters<typeof trpcMutation.mutate>[0]['data'];
        console.log('[DEBUG] useUpdateProduct - sending data:', JSON.stringify(apiData, null, 2));
        trpcMutation.mutate({ id: params.id, data: apiData });
      },
      mutateAsync: async (params: { id: string; data: Partial<ProductFormInput> | Partial<ProductInput> }) => {
        // Transform the data to match API expectations
        const apiData = params.data as Parameters<typeof trpcMutation.mutateAsync>[0]['data'];
        return trpcMutation.mutateAsync({ id: params.id, data: apiData });
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

export function useDeleteProduct() {
  const restMutation = useDeleteProductREST();
  const queryClient = useQueryClient();
  
  const trpcMutation = trpc.product.delete.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
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
      void queryClient.invalidateQueries({ queryKey: ['products'] });
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

