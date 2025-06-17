import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { CartItem, Product, ApiResponse } from '@/types';
import toast from 'react-hot-toast';
import { useCurrentUser } from './useAuth';

interface CartResponse {
  cartItems: (CartItem & { product: Product })[];
  totalAmount: number;
  subtotal: number;
  coupon: {
    code: string;
    discountPercentage: number;
  } | null;
}

export const useCart = () => {
  const { data: user } = useCurrentUser();
  
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<CartResponse>>('/cart');
      return data.data || { cartItems: [], totalAmount: 0, subtotal: 0, coupon: null };
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
      const { data } = await apiClient.post<ApiResponse>('/cart', { productId });
      return data;
    },
    onMutate: async (product) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cart'] });

      // Snapshot previous value
      const previousCart = queryClient.getQueryData<CartResponse>(['cart']);

      // Get productId and product data
      const productId = typeof product === 'string' ? product : product._id;
      const productData = typeof product === 'string' ? null : product;

      // Optimistically update
      queryClient.setQueryData<CartResponse>(['cart'], (old) => {
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
      const { data } = await apiClient.put<ApiResponse>(`/cart/${productId}`, { quantity });
      return data;
    },
    onMutate: async ({ productId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData<CartResponse>(['cart']);

      queryClient.setQueryData<CartResponse>(['cart'], (old) => {
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
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      await apiClient.delete(`/cart/${productId}`);
    },
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData<CartResponse>(['cart']);

      queryClient.setQueryData<CartResponse>(['cart'], (old) => {
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
      const { data } = await apiClient.post<ApiResponse>('/coupons/apply', { code });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Coupon applied successfully');
    },
  });
};

export const useRemoveCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.delete('/coupons/remove');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Coupon removed');
    },
  });
};