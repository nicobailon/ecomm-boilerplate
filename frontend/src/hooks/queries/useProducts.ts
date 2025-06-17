import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Product, ApiResponse, PaginatedResponse, ProductCategory } from '@/types';
import { ProductInput } from '@/lib/validations';
import { toast } from 'sonner';

export const useProducts = (category?: ProductCategory, page = 1, limit = 12) => {
  return useQuery({
    queryKey: ['products', category ?? 'all', page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
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
      const { data } = await apiClient.get<ApiResponse<Product[]>>('/products/featured');
      return data.data;
    },
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: ProductInput) => {
      const { data } = await apiClient.post<ApiResponse<Product>>('/products', productData);
      return data.data;
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
      const response = await apiClient.patch<ApiResponse<Product>>(`/products/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
      toast.success('Product updated successfully');
    },
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
      const { data } = await apiClient.patch<ApiResponse<Product>>(
        `/products/${id}/toggle-featured`
      );
      return data.data;
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