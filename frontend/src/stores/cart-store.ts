import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface CartItem {
  _id: string;
  quantity: number;
  variantId?: string;
}

interface CartStore {
  items: CartItem[];
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  setItems: (items: CartItem[]) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  devtools(
    (set) => ({
      items: [],
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item._id === productId ? { ...item, quantity } : item,
          ),
        })),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item._id !== productId),
        })),
      setItems: (items) => set({ items }),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'cart-store',
    },
  ),
);