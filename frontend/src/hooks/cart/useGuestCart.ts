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

export const useGuestAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Product) => {
      try {
        return addToGuestCart(product);
      } catch (error) {
        if (error instanceof Error && error.message.includes('Guest cart is limited')) {
          toast.error(error.message);
        }
        throw error;
      }
    },
    onMutate: async (product) => {
      await queryClient.cancelQueries({ queryKey: ['guestCart'] });
      const previousCart = queryClient.getQueryData<GuestCartData>(['guestCart']);

      queryClient.setQueryData<GuestCartData>(['guestCart'], (old) => {
        if (!old) return old;
        
        const existingItem = old.cartItems.find(item => item.product._id === product._id);
        if (existingItem) {
          return {
            ...old,
            cartItems: old.cartItems.map(item =>
              item.product._id === product._id
                ? { ...item, quantity: item.quantity + 1 }
                : item,
            ),
          };
        }
        
        return {
          ...old,
          cartItems: [...old.cartItems, { product, quantity: 1 }],
        };
      });

      return { previousCart };
    },
    onError: (err, _product, context) => {
      if (context?.previousCart) {
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
      toast.success('Added to cart');
    },
  });
};

export const useGuestUpdateQuantity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) => {
      return Promise.resolve(updateGuestCartQuantity(productId, quantity));
    },
    onMutate: async ({ productId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['guestCart'] });
      const previousCart = queryClient.getQueryData<GuestCartData>(['guestCart']);

      queryClient.setQueryData<GuestCartData>(['guestCart'], (old) => {
        if (!old) return old;
        
        if (quantity <= 0) {
          return {
            ...old,
            cartItems: old.cartItems.filter(item => item.product._id !== productId),
          };
        }
        
        return {
          ...old,
          cartItems: old.cartItems.map(item =>
            item.product._id === productId
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
    mutationFn: (productId: string) => {
      return Promise.resolve(removeFromGuestCart(productId));
    },
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ['guestCart'] });
      const previousCart = queryClient.getQueryData<GuestCartData>(['guestCart']);

      queryClient.setQueryData<GuestCartData>(['guestCart'], (old) => {
        if (!old) return old;
        
        return {
          ...old,
          cartItems: old.cartItems.filter(item => item.product._id !== productId),
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