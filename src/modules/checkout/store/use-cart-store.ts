import { create } from "zustand";

// 1. ✅ Updated structure to include variantName
export type CartItem = {
  productId: string;
  variantId?: string; 
  variantName?: string; // Add this to store "Blue / XL"
};

interface TenantCart {
  items: CartItem[]; 
}

interface CartState {
  tenantCarts: Record<string, TenantCart>;
  getCartByTenant: (tenantSlug: string) => TenantCart;
  // ✅ Updated signatures to accept variantName
  addProduct: (tenantSlug: string, productId: string, variantId?: string, variantName?: string) => void;
  removeProduct: (tenantSlug: string, productId: string, variantId?: string) => void;
  clearCart: (tenantSlug: string) => void;
  clearAllCarts: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  tenantCarts: {},

  getCartByTenant: (tenantSlug) =>
    get().tenantCarts[tenantSlug] || { items: [] },

  addProduct: (tenantSlug, productId, variantId, variantName) =>
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
              // ✅ Store the name along with the IDs
              { productId, variantId, variantName },
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