import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartItem = {
  productId: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
};

interface TenantCart {
  items: CartItem[];
}

interface CartState {
  tenantCarts: Record<string, TenantCart>;
  getCartByTenant: (tenantSlug: string) => TenantCart;
  addProduct: (
    tenantSlug: string,
    productId: string,
    variantId?: string,
    variantName?: string,
    quantity?: number
  ) => void;
  removeProduct: (tenantSlug: string, productId: string, variantId?: string) => void;
  updateQuantity: (
    tenantSlug: string,
    productId: string,
    variantId: string | undefined,
    newQuantity: number
  ) => void;
  clearCart: (tenantSlug: string) => void;
  clearAllCarts: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      tenantCarts: {},

      getCartByTenant: (tenantSlug) =>
        get().tenantCarts[tenantSlug] || { items: [] },

      addProduct: (tenantSlug, productId, variantId, variantName, quantity = 1) => {
        if (!productId) return;

        set((state) => {
          const currentCart = state.tenantCarts[tenantSlug] || { items: [] };
          const existingItemIndex = currentCart.items.findIndex(
            (item) => item.productId === productId && item.variantId === variantId
          );

          let newItems = [...currentCart.items];

          if (existingItemIndex !== -1) {
            // ✅ FIX: Use a non-null assertion (!) or check if the item exists
            // because we are inside the !== -1 block, we know it exists.
            const existingItem = newItems[existingItemIndex]!; 
            
            newItems[existingItemIndex] = {
              ...existingItem,
              quantity: existingItem.quantity + quantity,
            };
          } else {
            newItems.push({
              productId,
              variantId,
              variantName,
              quantity,
            });
          }

          return {
            tenantCarts: {
              ...state.tenantCarts,
              [tenantSlug]: {
                items: newItems,
              },
            },
          };
        });
      },

      updateQuantity: (tenantSlug, productId, variantId, newQuantity) =>
        set((state) => ({
          tenantCarts: {
            ...state.tenantCarts,
            [tenantSlug]: {
              items: (state.tenantCarts[tenantSlug]?.items || []).map((item) =>
                item.productId === productId && item.variantId === variantId
                  ? { ...item, quantity: Math.max(1, newQuantity) }
                  : item
              ),
            },
          },
        })),

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
    }),
    {
      name: "tenant-carts-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);