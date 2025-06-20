import type { Product } from '@/types';
import { useCurrentUser } from '../auth/useAuth';
import { 
  useCart, 
  useAddToCart, 
  useUpdateQuantity, 
  useRemoveFromCart,
  useApplyCoupon,
  useRemoveCoupon, 
} from './useCart';
import { 
  useGuestCart, 
  useGuestAddToCart, 
  useGuestUpdateQuantity, 
  useGuestRemoveFromCart, 
} from './useGuestCart';

export type CartSource = 'guest' | 'user';

export interface UnifiedCartResult {
  data: {
    cartItems: {
      product: Product;
      quantity: number;
      variantId?: string;
      variantDetails?: {
        label?: string;
        size?: string;
        color?: string;
        price: number;
        sku?: string;
        attributes?: Record<string, string>;
      };
    }[];
    totalAmount: number;
    subtotal: number;
    appliedCoupon: {
      code: string;
      discountPercentage: number;
    } | null;
  } | undefined;
  totalQuantity: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  source: CartSource;
}

export const useUnifiedCart = (): UnifiedCartResult => {
  const { data: user } = useCurrentUser();
  const userCart = useCart();
  const guestCart = useGuestCart();

  const isGuest = !user;

  const cartData = isGuest ? guestCart.data : userCart.data;
  const totalQuantity = cartData?.cartItems?.reduce((acc, item) => acc + item.quantity, 0) ?? 0;

  if (isGuest) {
    return {
      data: guestCart.data,
      totalQuantity,
      isLoading: guestCart.isLoading,
      isError: guestCart.isError,
      error: guestCart.error,
      source: 'guest',
    };
  }

  return {
    data: userCart.data,
    totalQuantity,
    isLoading: userCart.isLoading,
    isError: userCart.isError,
    error: userCart.error,
    source: 'user',
  };
};

export interface AddToCartParams {
  product: Product;
  variantId?: string;
  variantLabel?: string;
  variantAttributes?: Record<string, string>;
}

export const useUnifiedAddToCart = () => {
  const { data: user } = useCurrentUser();
  const userAddToCart = useAddToCart();
  const guestAddToCart = useGuestAddToCart();

  const isGuestLike = !user;

  return {
    mutate: (params: AddToCartParams) => {
      if (!user) {
        guestAddToCart.mutate(params);
      } else {
        userAddToCart.mutate(params);
      }
    },
    mutateAsync: async (params: AddToCartParams) => {
      if (!user) {
        return guestAddToCart.mutateAsync(params);
      } else {
        return userAddToCart.mutateAsync(params);
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

  const isGuestLike = !user;

  return {
    mutate: (params: { productId: string; quantity: number; variantId?: string; variantLabel?: string }) => {
      if (!user) {
        guestUpdateQuantity.mutate(params);
      } else {
        userUpdateQuantity.mutate(params);
      }
    },
    mutateAsync: async (params: { productId: string; quantity: number; variantId?: string; variantLabel?: string }) => {
      if (!user) {
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

export interface RemoveFromCartParams {
  productId: string;
  variantId?: string;
  variantLabel?: string;
}

export const useUnifiedRemoveFromCart = () => {
  const { data: user } = useCurrentUser();
  const userRemoveFromCart = useRemoveFromCart();
  const guestRemoveFromCart = useGuestRemoveFromCart();

  const isGuestLike = !user;

  return {
    mutate: (params: RemoveFromCartParams | string) => {
      // Support both old string API and new params object
      const normalizedParams = typeof params === 'string' ? { productId: params } : params;
      if (!user) {
        guestRemoveFromCart.mutate(normalizedParams);
      } else {
        userRemoveFromCart.mutate(normalizedParams);
      }
    },
    mutateAsync: async (params: RemoveFromCartParams | string) => {
      const normalizedParams = typeof params === 'string' ? { productId: params } : params;
      if (!user) {
        return guestRemoveFromCart.mutateAsync(normalizedParams);
      } else {
        return userRemoveFromCart.mutateAsync(normalizedParams);
      }
    },
    isPending: isGuestLike ? guestRemoveFromCart.isPending : userRemoveFromCart.isPending,
    isError: isGuestLike ? guestRemoveFromCart.isError : userRemoveFromCart.isError,
    error: isGuestLike ? guestRemoveFromCart.error : userRemoveFromCart.error,
  };
};

export { useApplyCoupon, useRemoveCoupon };