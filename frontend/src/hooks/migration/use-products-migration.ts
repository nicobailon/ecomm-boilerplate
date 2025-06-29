import { trpc } from '@/lib/trpc';
import type { ProductInput, ProductFormInput } from '@/lib/validations';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useProducts(page = 1, limit = 12, search?: string) {
  const trpcQuery = trpc.product.list.useQuery({ page, limit, search });

  return {
    data: trpcQuery.data,
    isLoading: trpcQuery.isLoading,
    error: trpcQuery.error,
    isError: trpcQuery.isError,
    refetch: trpcQuery.refetch,
  };
}

export function useFeaturedProducts() {
  const trpcQuery = trpc.product.featured.useQuery();

  return {
    data: trpcQuery.data,
    isLoading: trpcQuery.isLoading,
    error: trpcQuery.error,
    isError: trpcQuery.isError,
    refetch: trpcQuery.refetch,
  };
}

export function useProductById(id: string) {
  const trpcQuery = trpc.product.byId.useQuery(id, {
    enabled: !!id,
  });

  return {
    data: trpcQuery.data,
    isLoading: trpcQuery.isLoading,
    error: trpcQuery.error,
    isError: trpcQuery.isError,
    refetch: trpcQuery.refetch,
  };
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  const trpcMutation = trpc.product.create.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
    },
  });

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

export function useUpdateProduct() {
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
          const queryKey = query.queryKey as unknown[];
          const queryData = queryKey[3] as { input?: { productId?: string } } | undefined;
          return queryData?.input?.productId === variables.id;
        },
      });

      // Invalidate general inventory queries
      void queryClient.invalidateQueries({ queryKey: ['trpc.inventory.getInventoryMetrics'] });
      void queryClient.invalidateQueries({ queryKey: ['trpc.inventory.list'] });
      void queryClient.invalidateQueries({ queryKey: ['trpc.inventory.getLowStockProducts'] });

      toast.success('Product updated successfully');
    },
  });

  return {
    mutate: (params: { id: string; data: Partial<ProductFormInput> | Partial<ProductInput> }) => {
      // Transform the data to match API expectations
      const apiData = params.data as Parameters<typeof trpcMutation.mutate>[0]['data'];
      // Transform data for tRPC mutation
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

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  const trpcMutation = trpc.product.delete.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
    },
  });

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

export function useToggleFeatured() {
  const queryClient = useQueryClient();

  const trpcMutation = trpc.product.toggleFeatured.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated');
    },
  });

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

