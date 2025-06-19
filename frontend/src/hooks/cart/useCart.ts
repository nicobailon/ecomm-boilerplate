import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Cart, Product, ApiResponse } from '@/types';
import { toast } from 'sonner';
import { useCurrentUser } from '../auth/useAuth';


export const useCart = () => {
  const { data: user } = useCurrentUser();
  
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const { data } = await apiClient.get<Cart>('/cart');
      return data || { cartItems: [], totalAmount: 0, subtotal: 0, appliedCoupon: null };
    },
    enabled: !!user && user.role !== 'admin', // Only fetch cart for non-admin users
    retry: false, // Don't retry if the cart fetch fails
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Product | string) => {
      const productId = typeof product === 'string' ? product : product._id;
      const { data } = await apiClient.post<Cart>('/cart', { productId });
      return data;
    },
    onMutate: async (product) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cart'] });

      // Snapshot previous value
      const previousCart = queryClient.getQueryData<Cart>(['cart']);

      // Get productId and product data
      const productId = typeof product === 'string' ? product : product._id;
      const productData = typeof product === 'string' ? null : product;

      // Optimistically update
      queryClient.setQueryData<Cart>(['cart'], (old) => {
        if (!old) return old;
        
        const existingItem = old.cartItems.find(item => item.product._id === productId);
        if (existingItem) {
          return {
            ...old,
            cartItems: old.cartItems.map(item =>
              item.product._id === productId
                ? { ...item, quantity: item.quantity + 1 }
                : item
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
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onSuccess: () => {
      toast.success('Added to cart');
    },
  });
};

export const useUpdateQuantity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const { data } = await apiClient.put<Cart>(`/cart/${productId}`, { quantity });
      return data;
    },
    onMutate: async ({ productId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData<Cart>(['cart']);

      queryClient.setQueryData<Cart>(['cart'], (old) => {
        if (!old) return old;
        
        return {
          ...old,
          cartItems: old.cartItems.map(item =>
            item.product._id === productId
              ? { ...item, quantity }
              : item
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
      queryClient.invalidateQueries({ queryKey: ['cart'] });
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
    mutationFn: async (productId: string) => {
      const { data } = await apiClient.delete<Cart>(`/cart/${productId}`);
      return data;
    },
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData<Cart>(['cart']);

      queryClient.setQueryData<Cart>(['cart'], (old) => {
        if (!old) return old;
        
        return {
          ...old,
          cartItems: old.cartItems.filter(item => item.product._id !== productId),
        };
      });

      return { previousCart };
    },
    onError: (_err, _productId, context) => {
      queryClient.setQueryData(['cart'], context?.previousCart);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
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
    onError: (error: any, _code, context) => {
      queryClient.setQueryData(['cart'], context?.previousCart);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to apply coupon';
      toast.error(errorMessage);
    },
    onSuccess: (data) => {
      if (data.data?.cart) {
        queryClient.setQueryData(['cart'], data.data.cart);
      }
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success(data.data?.message || 'Coupon applied successfully');
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
    onError: (error: any, _variables, context) => {
      queryClient.setQueryData(['cart'], context?.previousCart);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to remove coupon';
      toast.error(errorMessage);
    },
    onSuccess: (data) => {
      if (data.data?.cart) {
        queryClient.setQueryData(['cart'], data.data.cart);
      }
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success(data.data?.message || 'Coupon removed');
    },
  });
};