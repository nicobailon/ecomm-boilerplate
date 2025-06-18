import { Product } from '@/types';
import { useCurrentUser } from '../auth/useAuth';
import { 
  useCart, 
  useAddToCart, 
  useUpdateQuantity, 
  useRemoveFromCart,
  useApplyCoupon,
  useRemoveCoupon 
} from './useCart';
import { 
  useGuestCart, 
  useGuestAddToCart, 
  useGuestUpdateQuantity, 
  useGuestRemoveFromCart 
} from './useGuestCart';
import { toast } from 'sonner';

export type CartSource = 'guest' | 'user';

export interface UnifiedCartResult {
  data: {
    cartItems: Array<{
      product: Product;
      quantity: number;
    }>;
    totalAmount: number;
    subtotal: number;
    coupon: {
      code: string;
      discountPercentage: number;
    } | null;
  } | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  source: CartSource;
}

export const useUnifiedCart = (): UnifiedCartResult => {
  const { data: user } = useCurrentUser();
  const userCart = useCart();
  const guestCart = useGuestCart();

  const isGuest = !user || user.role === 'admin';

  if (isGuest) {
    return {
      data: guestCart.data,
      isLoading: guestCart.isLoading,
      isError: guestCart.isError,
      error: guestCart.error,
      source: 'guest',
    };
  }

  return {
    data: userCart.data,
    isLoading: userCart.isLoading,
    isError: userCart.isError,
    error: userCart.error,
    source: 'user',
  };
};

export const useUnifiedAddToCart = () => {
  const { data: user } = useCurrentUser();
  const userAddToCart = useAddToCart();
  const guestAddToCart = useGuestAddToCart();

  const isGuestLike = !user || user.role === 'admin';

  return {
    mutate: (product: Product) => {
      if (!user) {
        guestAddToCart.mutate(product);
      } else if (user.role === 'admin') {
        toast.error('Admins cannot add items to cart');
      } else {
        userAddToCart.mutate(product);
      }
    },
    mutateAsync: async (product: Product) => {
      if (!user) {
        return guestAddToCart.mutateAsync(product);
      } else if (user.role === 'admin') {
        toast.error('Admins cannot add items to cart');
        return Promise.reject(new Error('Admins cannot add items to cart'));
      } else {
        return userAddToCart.mutateAsync(product);
      }
    },
    isPending: isGuestLike ? guestAddToCart.isPending : userAddToCart.isPending,
    isError: isGuestLike ? guestAddToCart.isError : userAddToCart.isError,
    error: isGuestLike ? guestAddToCart.error : userAddToCart.error,
  };
};

export const useUnifiedUpdateQuantity = () => {
  const { data: user } = useCurrentUser();
  const userUpdateQuantity = useUpdateQuantity();
  const guestUpdateQuantity = useGuestUpdateQuantity();

  const isGuestLike = !user || user.role === 'admin';

  return {
    mutate: (params: { productId: string; quantity: number }) => {
      if (!user || user.role === 'admin') {
        guestUpdateQuantity.mutate(params);
      } else {
        userUpdateQuantity.mutate(params);
      }
    },
    mutateAsync: async (params: { productId: string; quantity: number }) => {
      if (!user || user.role === 'admin') {
        return guestUpdateQuantity.mutateAsync(params);
      } else {
        return userUpdateQuantity.mutateAsync(params);
      }
    },
    isPending: isGuestLike ? guestUpdateQuantity.isPending : userUpdateQuantity.isPending,
    isError: isGuestLike ? guestUpdateQuantity.isError : userUpdateQuantity.isError,
    error: isGuestLike ? guestUpdateQuantity.error : userUpdateQuantity.error,
  };
};

export const useUnifiedRemoveFromCart = () => {
  const { data: user } = useCurrentUser();
  const userRemoveFromCart = useRemoveFromCart();
  const guestRemoveFromCart = useGuestRemoveFromCart();

  const isGuestLike = !user || user.role === 'admin';

  return {
    mutate: (productId: string) => {
      if (!user || user.role === 'admin') {
        guestRemoveFromCart.mutate(productId);
      } else {
        userRemoveFromCart.mutate(productId);
      }
    },
    mutateAsync: async (productId: string) => {
      if (!user || user.role === 'admin') {
        return guestRemoveFromCart.mutateAsync(productId);
      } else {
        return userRemoveFromCart.mutateAsync(productId);
      }
    },
    isPending: isGuestLike ? guestRemoveFromCart.isPending : userRemoveFromCart.isPending,
    isError: isGuestLike ? guestRemoveFromCart.isError : userRemoveFromCart.isError,
    error: isGuestLike ? guestRemoveFromCart.error : userRemoveFromCart.error,
  };
};

export { useApplyCoupon, useRemoveCoupon };