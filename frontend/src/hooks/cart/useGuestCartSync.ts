import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '../auth/useAuth';
import { useAddToCart } from './useCart';
import { useGuestCart, useGuestClearCart } from './useGuestCart';
import { toast } from 'sonner';

export const useGuestCartSync = () => {
  const { data: user } = useCurrentUser();
  const { data: guestCart } = useGuestCart();
  const addToCart = useAddToCart();
  const clearGuestCart = useGuestClearCart();
  const queryClient = useQueryClient();
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    const syncGuestCart = async () => {
      if (!user || user.role === 'admin' || hasSyncedRef.current) {
        return;
      }

      if (!guestCart || guestCart.cartItems.length === 0) {
        return;
      }

      hasSyncedRef.current = true;

      const toastId = toast.loading('Syncing your cart...');

      try {
        await Promise.all(
          guestCart.cartItems.map((item) =>
            addToCart.mutateAsync(item.product)
          )
        );

        await clearGuestCart.mutateAsync();
        
        queryClient.invalidateQueries({ queryKey: ['cart'] });
        
        toast.success(
          `Added ${guestCart.cartItems.length} item(s) to your cart`,
          { id: toastId }
        );
      } catch (error) {
        console.error('Failed to sync guest cart:', error);
        toast.error('Failed to sync some cart items', { id: toastId });
        hasSyncedRef.current = false;
      }
    };

    syncGuestCart();
  }, [user, guestCart, addToCart, clearGuestCart, queryClient]);
};