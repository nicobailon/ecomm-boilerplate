import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Cart, Product, ApiResponse } from '@/types';
import { toast } from 'sonner';
import { useCurrentUser } from '../auth/useAuth';
import type { AxiosError } from 'axios';

export const useCart = () => {
  const { data: user } = useCurrentUser();
  
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const { data } = await apiClient.get<Cart>('/cart');
      return data ?? { cartItems: [], totalAmount: 0, subtotal: 0, appliedCoupon: null };
    },
    enabled: !!user && user.role !== 'admin', // Only fetch cart for non-admin users
    retry: false, // Don't retry if the cart fetch fails
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { product: Product; variantId?: string } | Product | string) => {
      // Handle different parameter formats for backward compatibility
      let productId: string;
      let variantId: string | undefined;
      
      if (typeof params === 'string') {
        productId = params;
      } else if ('product' in params) {
        productId = params.product._id;
        variantId = params.variantId;
      } else {
        productId = params._id;
      }
      
      const { data } = await apiClient.post<Cart>('/cart', { productId, variantId });
      return data;
    },
    onMutate: async (params) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cart'] });

      // Snapshot previous value
      const previousCart = queryClient.getQueryData<Cart>(['cart']);

      // Extract data based on parameter format
      let productId: string;
      let variantId: string | undefined;
      let productData: Product | null = null;
      
      if (typeof params === 'string') {
        productId = params;
      } else if ('product' in params) {
        productId = params.product._id;
        variantId = params.variantId;
        productData = params.product;
      } else {
        productId = params._id;
        productData = params;
      }

      // Optimistically update
      queryClient.setQueryData<Cart>(['cart'], (old) => {
        if (!old) return old;
        
        const existingItem = old.cartItems.find(item => 
          item.product._id === productId && item.variantId === variantId
        );
        
        if (existingItem) {
          return {
            ...old,
            cartItems: old.cartItems.map(item =>
              item.product._id === productId && item.variantId === variantId
                ? { ...item, quantity: item.quantity + 1 }
                : item,
            ),
          };
        }
        
        // Add new item optimistically if we have product data
        if (productData) {
          return {
            ...old,
            cartItems: [
              ...old.cartItems,
              {
                product: productData,
                quantity: 1,
                variantId,
              },
            ],
          };
        }
        
        return old;
      });

      return { previousCart };
    },
    onError: (_err, _product, context) => {
      queryClient.setQueryData(['cart'], context?.previousCart);
      toast.error('Failed to add to cart');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onSuccess: () => {
      toast.success('Added to cart');
    },
  });
};

export const useUpdateQuantity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, quantity, variantId }: { productId: string; quantity: number; variantId?: string }) => {
      const { data } = await apiClient.put<Cart>(`/cart/${productId}`, { quantity, variantId });
      return data;
    },
    onMutate: async ({ productId, quantity, variantId }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData<Cart>(['cart']);

      queryClient.setQueryData<Cart>(['cart'], (old) => {
        if (!old) return old;
        
        return {
          ...old,
          cartItems: old.cartItems.map(item =>
            item.product._id === productId && item.variantId === variantId
              ? { ...item, quantity }
              : item,
          ),
        };
      });

      return { previousCart };
    },
    onError: (_err, _variables, context) => {
      queryClient.setQueryData(['cart'], context?.previousCart);
      toast.error('Failed to update quantity');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(['cart'], data);
      }
      toast.success('Cart updated');
    },
  });
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { productId: string; variantId?: string } | string) => {
      // Support both old string API and new params object
      const productId = typeof params === 'string' ? params : params.productId;
      const variantId = typeof params === 'string' ? undefined : params.variantId;
      
      const { data } = await apiClient.delete<Cart>(`/cart/${productId}`, {
        params: variantId ? { variantId } : undefined
      });
      return data;
    },
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData<Cart>(['cart']);

      const productId = typeof params === 'string' ? params : params.productId;
      const variantId = typeof params === 'string' ? undefined : params.variantId;

      queryClient.setQueryData<Cart>(['cart'], (old) => {
        if (!old) return old;
        
        return {
          ...old,
          cartItems: old.cartItems.filter(item => 
            !(item.product._id === productId && item.variantId === variantId)
          ),
        };
      });

      return { previousCart };
    },
    onError: (_err, _productId, context) => {
      queryClient.setQueryData(['cart'], context?.previousCart);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onSuccess: () => {
      toast.success('Removed from cart');
    },
  });
};

export const useApplyCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const { data } = await apiClient.post<ApiResponse<{ success: boolean; message: string; cart: Cart }>>('/api/coupons/apply', { code });
      return data;
    },
    onMutate: async (_code: string) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData<Cart>(['cart']);
      return { previousCart };
    },
    onError: (error: AxiosError<{ message?: string }>, _code, context) => {
      queryClient.setQueryData(['cart'], context?.previousCart);
      const errorMessage = error.response?.data?.message ?? error.message ?? 'Failed to apply coupon';
      toast.error(errorMessage);
    },
    onSuccess: (data) => {
      if (data.data?.cart) {
        queryClient.setQueryData(['cart'], data.data.cart);
      }
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success(data.data?.message ?? 'Coupon applied successfully');
    },
  });
};

export const useRemoveCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.delete<ApiResponse<{ success: boolean; message: string; cart: Cart }>>('/api/coupons/remove');
      return data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData<Cart>(['cart']);
      
      // Optimistically remove coupon
      if (previousCart) {
        queryClient.setQueryData<Cart>(['cart'], {
          ...previousCart,
          appliedCoupon: null,
          totalAmount: previousCart.subtotal,
        });
      }
      
      return { previousCart };
    },
    onError: (error: AxiosError<{ message?: string }>, _variables, context) => {
      queryClient.setQueryData(['cart'], context?.previousCart);
      const errorMessage = error.response?.data?.message ?? error.message ?? 'Failed to remove coupon';
      toast.error(errorMessage);
    },
    onSuccess: (data) => {
      if (data.data?.cart) {
        queryClient.setQueryData(['cart'], data.data.cart);
      }
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success(data.data?.message ?? 'Coupon removed');
    },
  });
};