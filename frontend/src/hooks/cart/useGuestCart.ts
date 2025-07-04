import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Product } from '@/types';
import type {
  GuestCartData} from './guestCart';
import {
  readGuestCart,
  addToGuestCart,
  updateGuestCartQuantity,
  removeFromGuestCart,
  clearGuestCart,
} from './guestCart';

export const useGuestCart = () => {
  return useQuery({
    queryKey: ['guestCart'],
    queryFn: readGuestCart,
    staleTime: 0,
    refetchOnMount: 'always',
  });
};

export const useGuestAddToCart = (options?: { showToast?: boolean }) => {
  const queryClient = useQueryClient();
  const showToast = options?.showToast ?? true;

  return useMutation({
    mutationFn: (params: { product: Product; variantId?: string } | Product) => {
      try {
        return Promise.resolve(addToGuestCart(params));
      } catch (error) {
        if (error instanceof Error && error.message.includes('Guest cart is limited')) {
          toast.error(error.message);
        }
        throw error;
      }
    },
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: ['guestCart'] });
      const previousCart = queryClient.getQueryData<GuestCartData>(['guestCart']);

      // Extract product and variant info
      const product = 'product' in params ? params.product : params;
      const variantId = 'product' in params ? params.variantId : undefined;

      queryClient.setQueryData<GuestCartData>(['guestCart'], (old) => {
        if (!old) return old;
        
        const existingItem = old.cartItems.find(item => 
          item.product._id === product._id && item.variantId === variantId,
        );
        
        if (existingItem) {
          return {
            ...old,
            cartItems: old.cartItems.map(item =>
              item.product._id === product._id && item.variantId === variantId
                ? { ...item, quantity: item.quantity + 1 }
                : item,
            ),
          };
        }
        
        return {
          ...old,
          cartItems: [...old.cartItems, { product, quantity: 1, variantId }],
        };
      });

      return { previousCart };
    },
    onError: (err, _product, context) => {
      if (context && 'previousCart' in context && context.previousCart) {
        queryClient.setQueryData(['guestCart'], context.previousCart);
      }
      if (!(err instanceof Error && err.message.includes('Guest cart is limited'))) {
        toast.error('Failed to add to cart');
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['guestCart'] });
    },
    onSuccess: () => {
      if (showToast) {
        toast.success('Added to cart');
      }
    },
  });
};

export const useGuestUpdateQuantity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, quantity, variantId }: { productId: string; quantity: number; variantId?: string }) => {
      return Promise.resolve(updateGuestCartQuantity(productId, quantity, variantId));
    },
    onMutate: async ({ productId, quantity, variantId }) => {
      await queryClient.cancelQueries({ queryKey: ['guestCart'] });
      const previousCart = queryClient.getQueryData<GuestCartData>(['guestCart']);

      queryClient.setQueryData<GuestCartData>(['guestCart'], (old) => {
        if (!old) return old;
        
        if (quantity <= 0) {
          return {
            ...old,
            cartItems: old.cartItems.filter(item => 
              !(item.product._id === productId && item.variantId === variantId),
            ),
          };
        }
        
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
      queryClient.setQueryData(['guestCart'], context?.previousCart);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['guestCart'] });
    },
  });
};

export const useGuestRemoveFromCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { productId: string; variantId?: string } | string) => {
      // Support both old string API and new params object
      const productId = typeof params === 'string' ? params : params.productId;
      const variantId = typeof params === 'string' ? undefined : params.variantId;
      return Promise.resolve(removeFromGuestCart(productId, variantId));
    },
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: ['guestCart'] });
      const previousCart = queryClient.getQueryData<GuestCartData>(['guestCart']);

      const productId = typeof params === 'string' ? params : params.productId;
      const variantId = typeof params === 'string' ? undefined : params.variantId;

      queryClient.setQueryData<GuestCartData>(['guestCart'], (old) => {
        if (!old) return old;
        
        const filteredItems = old.cartItems.filter(item => 
          !(item.product._id === productId && item.variantId === variantId),
        );
        
        // Recalculate totals for optimistic update
        const subtotal = filteredItems.reduce((sum, item) => {
          const price = item.variantDetails?.price ?? item.product.price;
          return sum + (price * item.quantity);
        }, 0);
        
        return {
          ...old,
          cartItems: filteredItems,
          subtotal,
          totalAmount: subtotal,
        };
      });

      return { previousCart };
    },
    onError: (_err, _productId, context) => {
      queryClient.setQueryData(['guestCart'], context?.previousCart);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['guestCart'] });
    },
    onSuccess: () => {
      toast.success('Removed from cart');
    },
  });
};

export const useGuestClearCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      clearGuestCart();
      return Promise.resolve();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['guestCart'] });
    },
  });
};