import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Cart, Product, ApiResponse } from '@/types';
import { toast } from 'sonner';
import { useCurrentUser } from '../auth/useAuth';
import type { AxiosError } from 'axios';

// Backend response type for cart items
interface BackendCartItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  collectionId?: string;
  isFeatured: boolean;
  quantity: number;
  variantId?: string;
  variantDetails?: {
    label?: string;
    size?: string;
    color?: string;
    price: number;
    sku?: string;
  };
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface BackendCartResponse {
  cartItems: BackendCartItem[];
  totalAmount: number;
  subtotal: number;
  appliedCoupon: {
    code: string;
    discountPercentage: number;
  } | null;
}

// Helper function to transform backend cart response to frontend format
const transformCartResponse = (data: BackendCartResponse): Cart => {
  if (!data?.cartItems) {
    return { cartItems: [], totalAmount: 0, subtotal: 0, appliedCoupon: null };
  }

  const transformedItems = data.cartItems.map((item) => {
    const { _id, name, description, price, image, collectionId, isFeatured, quantity, variantId, variantDetails, slug, createdAt, updatedAt } = item;
    
    return {
      product: {
        _id,
        name,
        description,
        price,
        image,
        collectionId,
        isFeatured,
        slug: slug ?? '',
        createdAt: createdAt ?? '',
        updatedAt: updatedAt ?? '',
      } as Product,
      quantity,
      variantId,
      variantDetails,
    };
  });
  
  return {
    cartItems: transformedItems,
    totalAmount: data.totalAmount ?? 0,
    subtotal: data.subtotal ?? 0,
    appliedCoupon: data.appliedCoupon ?? null,
  };
};

export const useCart = () => {
  const { data: user } = useCurrentUser();
  
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const { data } = await apiClient.get<BackendCartResponse>('/cart');
      return transformCartResponse(data);
    },
    enabled: !!user, // Only fetch cart for authenticated users
    retry: false, // Don't retry if the cart fetch fails
  });
};

/**
 * Parameters for adding items to cart.
 * 
 * @example
 * // Recommended format with explicit variant
 * addToCart({ product, variantId: 'variant-123', variantLabel: 'Large Blue' })
 * 
 * @deprecated The Product and string overloads are deprecated and will be removed in v2.0.
 * Use the object format with explicit product, variantId, and variantLabel instead.
 */
type AddToCartParams = 
  | { product: Product; variantId?: string; variantLabel?: string }  // New format with explicit variant
  | Product                                    // @deprecated Legacy format - product only
  | string;                                   // @deprecated Legacy format - product ID only

export const useAddToCart = (options?: { showToast?: boolean }) => {
  const queryClient = useQueryClient();
  const showToast = options?.showToast ?? true;

  return useMutation({
    mutationFn: async (params: AddToCartParams) => {
      // Handle different parameter formats for backward compatibility
      let productId: string;
      let variantId: string | undefined;
      
      if (typeof params === 'string') {
        // @deprecated - direct product ID string will be removed in v2.0
        console.warn('useAddToCart: Passing product ID as string is deprecated. Use { product, variantId?, variantLabel? } format instead.');
        productId = params;
      } else if ('product' in params) {
        productId = params.product._id;
        variantId = params.variantId;
      } else {
        // @deprecated - direct Product object will be removed in v2.0
        console.warn('useAddToCart: Passing Product object directly is deprecated. Use { product, variantId?, variantLabel? } format instead.');
        productId = params._id;
      }
      
      const variantLabel = typeof params === 'object' && 'variantLabel' in params ? params.variantLabel : undefined;
      const { data } = await apiClient.post<BackendCartResponse>('/cart', { productId, variantId, variantLabel });
      return transformCartResponse(data);
    },
    onMutate: async (params: AddToCartParams) => {
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
          item.product._id === productId && item.variantId === variantId,
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
      if (showToast) {
        toast.success('Added to cart');
      }
    },
  });
};

export const useUpdateQuantity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, quantity, variantId, variantLabel }: { productId: string; quantity: number; variantId?: string; variantLabel?: string }) => {
      const { data } = await apiClient.put<BackendCartResponse>(`/cart/${productId}`, { quantity, variantId, variantLabel });
      return transformCartResponse(data);
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

// Explicit type union for remove from cart parameters
type RemoveFromCartParams = 
  | { productId: string; variantId?: string; variantLabel?: string }  // New format with explicit variant
  | string;                                     // Legacy format - product ID only

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: RemoveFromCartParams) => {
      // Support both old string API and new params object
      const productId = typeof params === 'string' ? params : params.productId;
      const variantId = typeof params === 'string' ? undefined : params.variantId;
      const variantLabel = typeof params === 'string' ? undefined : params.variantLabel;
      
      // Backend expects variantId in request body for the DELETE /cart/:productId endpoint
      const requestConfig: { data?: { variantId?: string; variantLabel?: string } } = {};
      if (variantId !== undefined || variantLabel !== undefined) {
        requestConfig.data = { variantId, variantLabel };
      }
      
      const { data } = await apiClient.delete<BackendCartResponse>(`/cart/${productId}`, requestConfig);
      return transformCartResponse(data);
    },
    onMutate: async (params: RemoveFromCartParams) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData<Cart>(['cart']);

      const productId = typeof params === 'string' ? params : params.productId;
      const variantId = typeof params === 'string' ? undefined : params.variantId;

      queryClient.setQueryData<Cart>(['cart'], (old) => {
        if (!old) return old;
        
        return {
          ...old,
          cartItems: old.cartItems.filter(item => 
            !(item.product._id === productId && item.variantId === variantId),
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
      const { data } = await apiClient.post<ApiResponse<{ success: boolean; message: string; cart: BackendCartResponse }>>('/coupons/apply', { code });
      
      // Transform the cart in the response if it exists
      if (data.data?.cart) {
        return {
          ...data,
          data: {
            ...data.data,
            cart: transformCartResponse(data.data.cart),
          },
        };
      }
      
      return data as unknown as ApiResponse<{ success: boolean; message: string; cart: Cart }>;
    },
    onMutate: async () => {
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
      const { data } = await apiClient.delete<ApiResponse<{ success: boolean; message: string; cart: BackendCartResponse }>>('/coupons/remove');
      
      // Transform the cart in the response if it exists
      if (data.data?.cart) {
        return {
          ...data,
          data: {
            ...data.data,
            cart: transformCartResponse(data.data.cart),
          },
        };
      }
      
      return data as unknown as ApiResponse<{ success: boolean; message: string; cart: Cart }>;
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