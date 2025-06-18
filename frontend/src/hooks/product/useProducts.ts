import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Product, PaginatedResponse } from '@/types';
import { ProductInput } from '@/lib/validations';
import { toast } from 'sonner';

export const useProducts = (page = 1, limit = 12) => {
  return useQuery({
    queryKey: ['products', page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const { data } = await apiClient.get<PaginatedResponse<Product>>(
        `/products?${params.toString()}`
      );
      return data;
    },
  });
};

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const { data } = await apiClient.get<Product[]>('/products/featured');
      return data;
    },
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: ProductInput) => {
      const { data } = await apiClient.post<Product>('/products', productData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProductInput> }) => {
      const response = await apiClient.patch<Product>(`/products/${id}`, data);
      return response.data;
    },
    // Add optimistic update logic
    onMutate: async (updatedProduct) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['products'] });
      
      // Get all product queries from the cache
      const productQueries = queryClient.getQueriesData<PaginatedResponse<Product>>({ queryKey: ['products'] });
      
      // Update all cached product lists
      productQueries.forEach(([queryKey, data]) => {
        if (data?.data) {
          const updatedData = {
            ...data,
            data: data.data.map((product) =>
              product._id === updatedProduct.id ? { ...product, ...updatedProduct.data } : product
            )
          };
          queryClient.setQueryData(queryKey, updatedData);
        }
      });
      
      // Return a context object with all previous queries
      return { previousQueries: productQueries };
    },
    onError: (_err, _vars, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Update failed. Your changes have been rolled back.');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    // Remove the default onSuccess toast to avoid duplicates
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
    },
  });
};

export const useToggleFeatured = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch<Product>(
        `/products/${id}/toggle-featured`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated');
    },
  });
};

export const useProductRecommendations = () => {
  return useQuery({
    queryKey: ['products', 'recommendations'],
    queryFn: async () => {
      const { data } = await apiClient.get<Product[]>('/products/recommendations');
      return data;
    },
  });
};