import { useEffect, useCallback, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCurrentUser } from '@/hooks/auth/useAuth';
import { trpc } from '@/lib/trpc';
import type { CartItem } from '@/types';

interface InventoryUpdate {
  productId: string;
  variantId?: string;
  availableStock: number;
  reservedStock: number;
  totalStock: number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  timestamp: number;
}

interface CartValidation {
  userId: string;
  productId: string;
  variantId?: string;
  requestedQuantity: number;
  availableQuantity: number;
  action: 'reduce' | 'remove' | 'ok';
}

export function useRealtimeInventory() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const socketRef = useRef<Socket | null>(null);
  const subscribedProducts = useRef<Set<string>>(new Set());
  const utils = trpc.useUtils();

  // Initialize WebSocket connection
  useEffect(() => {
    if (!socketRef.current) {
      const socket = io(import.meta.env.VITE_API_URL ?? 'http://localhost:3000', {
        transports: ['websocket', 'polling'],
        auth: {
          token: user ? localStorage.getItem('accessToken') : undefined,
        },
      });

      socket.on('connect', () => {
        // Connected to real-time inventory updates
        
        // Re-subscribe to products if reconnecting
        if (subscribedProducts.current.size > 0) {
          socket.emit('subscribe:inventory', Array.from(subscribedProducts.current));
        }

        // Subscribe to cart validations if authenticated
        if (user) {
          socket.emit('subscribe:cart');
        }
      });

      socket.on('disconnect', () => {
        // Disconnected from real-time inventory updates
      });

      socket.on('inventory:update', handleInventoryUpdate);
      socket.on('cart:validation', handleCartValidation);

      socketRef.current = socket;
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  const handleInventoryUpdate = useCallback((update: InventoryUpdate) => {
    // Update React Query cache
    queryClient.setQueryData(
      ['inventory.getProductInventory', {
        productId: update.productId,
        variantId: update.variantId,
      }],
      (oldData: unknown) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          availableStock: update.availableStock,
          currentStock: update.totalStock,
          reservedStock: update.reservedStock,
          stockStatus: update.stockStatus,
        };
      },
    );

    // Update product list queries that might show inventory
    void utils.product.list.invalidate();

    // Show toast for significant changes
    if (update.stockStatus === 'out_of_stock') {
      toast.warning('Item is now out of stock', {
        description: 'The item you were viewing is no longer available.',
      });
    } else if (update.stockStatus === 'low_stock' && update.availableStock <= 3) {
      toast.info(`Only ${update.availableStock} left in stock`, {
        description: 'Hurry! Limited quantity available.',
      });
    }
  }, [queryClient, utils]);

  const handleCartValidation = useCallback((validation: CartValidation) => {
    // Only handle validations for current user
    if (validation.userId !== user?._id?.toString()) return;

    // Get current cart data
    const cartQuery = queryClient.getQueryData(['cart.getCart']) as { cartItems?: Array<{ product: unknown; variantId?: string }> } | undefined;
    if (!cartQuery?.cartItems) return;

    const affectedItem = cartQuery.cartItems.find(
      (item: { product: unknown; variantId?: string }) => {
        const product = item.product as { _id?: string } | undefined;
        return typeof item.product === 'object' && product?._id === validation.productId && 
               item.variantId === validation.variantId;
      },
    );

    if (!affectedItem) return;

    // Show appropriate notification
    if (validation.action === 'remove') {
      const product = affectedItem.product as { name?: string } | null;
      toast.error(`${typeof product === 'object' && product?.name ? product.name : 'Item'} is no longer available`, {
        description: 'This item has been removed from your cart.',
        duration: 5000,
      });
      
      // Invalidate cart to trigger refetch
      void utils.cart.get.invalidate();
    } else if (validation.action === 'reduce') {
      const product = affectedItem.product as { name?: string } | null;
      toast.warning(`${typeof product === 'object' && product?.name ? product.name : 'Item'} quantity reduced`, {
        description: `Only ${validation.availableQuantity} available. Your cart has been updated.`,
        duration: 5000,
      });
      
      // Update cart quantity optimistically
      queryClient.setQueryData(['cart.getCart'], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          cartItems: oldData.cartItems.map((item: CartItem) => {
            if (typeof item.product === 'object' && item.product._id === validation.productId && 
                item.variantId === validation.variantId) {
              return { ...item, quantity: validation.availableQuantity };
            }
            return item;
          }),
        };
      });
    }
  }, [user, queryClient, utils]);

  // Subscribe to product inventory updates
  const subscribeToProduct = useCallback((productId: string) => {
    if (!socketRef.current || subscribedProducts.current.has(productId)) return;

    subscribedProducts.current.add(productId);
    socketRef.current.emit('subscribe:inventory', [productId]);
  }, []);

  // Unsubscribe from product inventory updates
  const unsubscribeFromProduct = useCallback((productId: string) => {
    if (!socketRef.current || !subscribedProducts.current.has(productId)) return;

    subscribedProducts.current.delete(productId);
    socketRef.current.emit('unsubscribe:inventory', [productId]);
  }, []);

  // Subscribe to multiple products
  const subscribeToProducts = useCallback((productIds: string[]) => {
    if (!socketRef.current) return;

    const newProducts = productIds.filter(id => !subscribedProducts.current.has(id));
    if (newProducts.length === 0) return;

    newProducts.forEach(id => subscribedProducts.current.add(id));
    socketRef.current.emit('subscribe:inventory', newProducts);
  }, []);

  // Unsubscribe from all products
  const unsubscribeFromAllProducts = useCallback(() => {
    if (!socketRef.current || subscribedProducts.current.size === 0) return;

    socketRef.current.emit('unsubscribe:inventory', Array.from(subscribedProducts.current));
    subscribedProducts.current.clear();
  }, []);

  return {
    subscribeToProduct,
    unsubscribeFromProduct,
    subscribeToProducts,
    unsubscribeFromAllProducts,
    isConnected: socketRef.current?.connected ?? false,
  };
}

// Hook to use in product detail pages
export function useProductInventorySubscription(productId: string) {
  const { subscribeToProduct, unsubscribeFromProduct } = useRealtimeInventory();

  useEffect(() => {
    subscribeToProduct(productId);
    return () => unsubscribeFromProduct(productId);
  }, [productId, subscribeToProduct, unsubscribeFromProduct]);
}

// Hook to use in product list pages
export function useProductListInventorySubscription(productIds: string[]) {
  const { subscribeToProducts, unsubscribeFromAllProducts } = useRealtimeInventory();

  useEffect(() => {
    subscribeToProducts(productIds);
    return () => unsubscribeFromAllProducts();
  }, [productIds, subscribeToProducts, unsubscribeFromAllProducts]);
}