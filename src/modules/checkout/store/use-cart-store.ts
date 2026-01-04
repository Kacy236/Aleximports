import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface CartItem {
  id: string;
  quantity: number;
}

interface TenantCart {
  items: CartItem[]; // Changed from productIds: string[]
}

interface CartState {
  tenantCarts: Record<string, TenantCart>;
  getCartByTenant: (tenantSlug: string) => TenantCart;
  addProduct: (tenantSlug: string, productId: string) => void;
  removeProduct: (tenantSlug: string, productId: string) => void;
  setQuantity: (tenantSlug: string, productId: string, quantity: number) => void; // New action
  clearCart: (tenantSlug: string) => void;
  clearAllCarts: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      tenantCarts: {},

      getCartByTenant: (tenantSlug) =>
        get().tenantCarts[tenantSlug] || { items: [] },

      addProduct: (tenantSlug, productId) =>
        set((state) => {
          const currentCart = state.tenantCarts[tenantSlug] || { items: [] };
          const isAlreadyInCart = currentCart.items.some((item) => item.id === productId);

          // If it's already in the cart, we don't add it again (just keep state)
          if (isAlreadyInCart) return state;

          return {
            tenantCarts: {
              ...state.tenantCarts,
              [tenantSlug]: {
                items: [...currentCart.items, { id: productId, quantity: 1 }],
              },
            },
          };
        }),

      removeProduct: (tenantSlug, productId) =>
        set((state) => ({
          tenantCarts: {
            ...state.tenantCarts,
            [tenantSlug]: {
              items:
                state.tenantCarts[tenantSlug]?.items.filter(
                  (item) => item.id !== productId
                ) || [],
            },
          },
        })),

      setQuantity: (tenantSlug, productId, quantity) =>
        set((state) => {
          const currentCart = state.tenantCarts[tenantSlug];
          if (!currentCart) return state;

          return {
            tenantCarts: {
              ...state.tenantCarts,
              [tenantSlug]: {
                items: currentCart.items.map((item) =>
                  item.id === productId 
                    ? { ...item, quantity: Math.max(1, quantity) } // Ensure quantity is at least 1
                    : item
                ),
              },
            },
          };
        }),

      clearCart: (tenantSlug) =>
        set((state) => ({
          tenantCarts: {
            ...state.tenantCarts,
            [tenantSlug]: { items: [] },
          },
        })),

      clearAllCarts: () => set({ tenantCarts: {} }),
    }),
    {
      name: "cart-storage", // Keeps cart data after page refresh
      storage: createJSONStorage(() => localStorage),
    }
  )
);