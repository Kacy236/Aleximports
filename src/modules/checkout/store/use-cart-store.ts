import { create } from "zustand";

// 1. Define the structure for a specific item in the cart
export type CartItem = {
  productId: string;
  variantId?: string; // Optional: only present if the product has variants
};

interface TenantCart {
  // Changed from string[] to CartItem[]
  items: CartItem[]; 
}

interface CartState {
  tenantCarts: Record<string, TenantCart>;
  getCartByTenant: (tenantSlug: string) => TenantCart;
  // Updated signatures to include optional variantId
  addProduct: (tenantSlug: string, productId: string, variantId?: string) => void;
  removeProduct: (tenantSlug: string, productId: string, variantId?: string) => void;
  clearCart: (tenantSlug: string) => void;
  clearAllCarts: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  tenantCarts: {},

  getCartByTenant: (tenantSlug) =>
    get().tenantCarts[tenantSlug] || { items: [] },

  addProduct: (tenantSlug, productId, variantId) =>
    set((state) => {
      const currentCart = state.tenantCarts[tenantSlug] || { items: [] };

      // Prevent duplicate entries for the exact same product + variant combination
      const isAlreadyInCart = currentCart.items.some(
        (item) => item.productId === productId && item.variantId === variantId
      );

      if (isAlreadyInCart) return state;

      return {
        tenantCarts: {
          ...state.tenantCarts,
          [tenantSlug]: {
            items: [
              ...currentCart.items,
              { productId, variantId },
            ],
          },
        },
      };
    }),

  removeProduct: (tenantSlug, productId, variantId) =>
    set((state) => ({
      tenantCarts: {
        ...state.tenantCarts,
        [tenantSlug]: {
          items: (state.tenantCarts[tenantSlug]?.items || []).filter(
            (item) => 
              // Only remove the item if both the productId AND variantId match
              !(item.productId === productId && item.variantId === variantId)
          ),
        },
      },
    })),

  clearCart: (tenantSlug) =>
    set((state) => ({
      tenantCarts: {
        ...state.tenantCarts,
        [tenantSlug]: { items: [] },
      },
    })),

  clearAllCarts: () => set({ tenantCarts: {} }),
}));