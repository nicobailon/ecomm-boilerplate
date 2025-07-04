import type { Product } from '@/types';

const GUEST_CART_KEY = 'guest_cart_v1';
const MAX_GUEST_CART_ITEMS = 50;

const isClientSide = () => typeof window !== 'undefined';

export interface GuestCartItem {
  product: Product;
  quantity: number;
  variantId?: string;
  variantDetails?: {
    size?: string;
    color?: string;
    price: number;
    sku?: string;
  };
}

export interface GuestCartData {
  cartItems: GuestCartItem[];
  subtotal: number;
  totalAmount: number;
  appliedCoupon: null;
}

export const readGuestCart = (): GuestCartData => {
  if (!isClientSide()) {
    return { cartItems: [], subtotal: 0, totalAmount: 0, appliedCoupon: null };
  }
  
  try {
    const stored = localStorage.getItem(GUEST_CART_KEY);
    if (!stored) {
      return { cartItems: [], subtotal: 0, totalAmount: 0, appliedCoupon: null };
    }
    
    const parsed = JSON.parse(stored) as GuestCartData;
    return {
      cartItems: parsed.cartItems || [],
      subtotal: parsed.subtotal || 0,
      totalAmount: parsed.totalAmount || 0,
      appliedCoupon: null,
    };
  } catch {
    return { cartItems: [], subtotal: 0, totalAmount: 0, appliedCoupon: null };
  }
};

export const writeGuestCart = (cart: GuestCartData): void => {
  if (!isClientSide()) {
    return;
  }
  
  try {
    if (cart.cartItems.length > MAX_GUEST_CART_ITEMS) {
      throw new Error(`Guest cart cannot exceed ${MAX_GUEST_CART_ITEMS} items`);
    }
    
    const recalculated = recalculateTotals(cart.cartItems);
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(recalculated));
  } catch {
    // Handle error silently - localStorage may be unavailable
  }
};

export const clearGuestCart = (): void => {
  if (!isClientSide()) {
    return;
  }
  
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch {
    // Handle error silently - localStorage may be unavailable
  }
};

const recalculateTotals = (items: GuestCartItem[]): GuestCartData => {
  const subtotal = items.reduce((sum, item) => {
    const price = item.variantDetails?.price ?? item.product.price;
    return sum + (price * item.quantity);
  }, 0);
  
  return {
    cartItems: items,
    subtotal,
    totalAmount: subtotal,
    appliedCoupon: null,
  };
};

export interface AddToGuestCartParams {
  product: Product;
  variantId?: string;
  variantDetails?: {
    size?: string;
    color?: string;
    price: number;
    sku?: string;
  };
}

export const addToGuestCart = (params: AddToGuestCartParams | Product): GuestCartData => {
  const cart = readGuestCart();
  
  // Handle both old and new API
  let product: Product;
  let variantId: string | undefined;
  let variantDetails: GuestCartItem['variantDetails'] | undefined;
  
  if ('product' in params) {
    product = params.product;
    variantId = params.variantId;
    variantDetails = params.variantDetails;
  } else {
    product = params;
  }
  
  const existingItemIndex = cart.cartItems.findIndex(item => 
    item.product._id === product._id && item.variantId === variantId,
  );
  
  if (existingItemIndex >= 0) {
    cart.cartItems[existingItemIndex].quantity += 1;
  } else {
    if (cart.cartItems.length >= MAX_GUEST_CART_ITEMS) {
      throw new Error(`Cannot add more items. Guest cart is limited to ${MAX_GUEST_CART_ITEMS} items`);
    }
    cart.cartItems.push({ product, quantity: 1, variantId, variantDetails });
  }
  
  const updatedCart = recalculateTotals(cart.cartItems);
  writeGuestCart(updatedCart);
  return updatedCart;
};

export const updateGuestCartQuantity = (productId: string, quantity: number, variantId?: string): GuestCartData => {
  const cart = readGuestCart();
  const itemIndex = cart.cartItems.findIndex(item => 
    item.product._id === productId && item.variantId === variantId,
  );
  
  if (itemIndex >= 0) {
    if (quantity <= 0) {
      cart.cartItems.splice(itemIndex, 1);
    } else {
      cart.cartItems[itemIndex].quantity = quantity;
    }
  }
  
  const updatedCart = recalculateTotals(cart.cartItems);
  writeGuestCart(updatedCart);
  return updatedCart;
};

export const removeFromGuestCart = (productId: string, variantId?: string): GuestCartData => {
  const cart = readGuestCart();
  cart.cartItems = cart.cartItems.filter(item => 
    !(item.product._id === productId && item.variantId === variantId),
  );
  
  const updatedCart = recalculateTotals(cart.cartItems);
  writeGuestCart(updatedCart);
  return updatedCart;
};