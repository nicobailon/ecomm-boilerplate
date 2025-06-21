import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Product, PaginatedResponse } from '@/types';
import type { ProductInput } from '@/lib/validations';
import { toast } from 'sonner';

export const useProducts = (page = 1, limit = 12) => {
  return useQuery({
    queryKey: ['products', page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const { data } = await apiClient.get<PaginatedResponse<Product>>(
        `/products?${params.toString()}`,
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
      void queryClient.invalidateQueries({ queryKey: ['products'] });
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
              product._id === updatedProduct.id ? { ...product, ...updatedProduct.data } : product,
            ),
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
      void queryClient.invalidateQueries({ queryKey: ['products'] });
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
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
    },
  });
};

export const useToggleFeatured = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch<Product>(
        `/products/toggle-featured/${id}`,
      );
      return data;
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['products'] });
      
      // Snapshot all product queries
      const productQueries = queryClient.getQueriesData<PaginatedResponse<Product>>({ queryKey: ['products'] });
      const featuredQuery = queryClient.getQueryData<Product[]>(['products', 'featured']);
      
      // Optimistically update all product lists
      productQueries.forEach(([queryKey, data]) => {
        if (data?.data) {
          const updatedData = {
            ...data,
            data: data.data.map((product) =>
              product._id === id ? { ...product, isFeatured: !product.isFeatured } : product
            ),
          };
          queryClient.setQueryData(queryKey, updatedData);
        }
      });
      
      // Find the product to get its data for featured list update
      let toggledProduct: Product | undefined;
      productQueries.forEach(([, data]) => {
        if (data?.data && !toggledProduct) {
          toggledProduct = data.data.find(p => p._id === id);
        }
      });
      
      // Optimistically update featured products list
      if (featuredQuery && toggledProduct) {
        const isCurrentlyFeatured = toggledProduct.isFeatured;
        if (isCurrentlyFeatured) {
          // Remove from featured
          queryClient.setQueryData(['products', 'featured'], 
            featuredQuery.filter(p => p._id !== id)
          );
        } else {
          // Add to featured
          queryClient.setQueryData(['products', 'featured'], 
            [...featuredQuery, { ...toggledProduct, isFeatured: true }]
          );
        }
      }
      
      return { previousQueries: productQueries, previousFeatured: featuredQuery };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousFeatured) {
        queryClient.setQueryData(['products', 'featured'], context.previousFeatured);
      }
      toast.error('Failed to update featured status');
    },
    onSuccess: (updatedProduct) => {
      toast.success(
        <div className="flex flex-col gap-1">
          <span>
            {updatedProduct.isFeatured
              ? `${updatedProduct.name} added to homepage carousel`
              : `${updatedProduct.name} removed from homepage carousel`}
          </span>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline hover:no-underline"
            onClick={(e) => e.stopPropagation()}
          >
            View on homepage →
          </a>
        </div>,
      );
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: ['products', 'featured'] });
    },
  });

  return mutation;
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

// Type for featured product selector
export type ProductSelector = (product: Product) => boolean;
export type IsFeaturedSelector = ProductSelector;

// Selector helper for featured products
export const isFeaturedSelector: ProductSelector = (product) => {
  return product.isFeatured === true;
};