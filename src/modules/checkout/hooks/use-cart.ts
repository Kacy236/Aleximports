import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useCartStore } from "../store/use-cart-store";

export const useCart = (tenantSlug: string) => {
    const addProduct = useCartStore((state) => state.addProduct);
    const removeProduct = useCartStore((state) => state.removeProduct);
    const clearCart = useCartStore((state) => state.clearCart);
    const clearAllCarts = useCartStore((state) => state.clearAllCarts);

    const items = useCartStore(
        useShallow(
            (state) => state.tenantCarts[tenantSlug]?.items || []
        )
    );

    const isProductInCart = useCallback(
        (productId: string | undefined, variantId?: string) => {
            if (!productId) return false; // Safety check
            return items.some(
                (item) => item.productId === productId && item.variantId === variantId
            );
        },
        [items]
    );

    const toggleProduct = useCallback(
        (productId: string | undefined, variantId?: string, variantName?: string, quantity: number = 1) => {
            // 1. Guard check: If there's no ID, we can't do anything
            if (!productId) return; 

            if (isProductInCart(productId, variantId)) {
                removeProduct(tenantSlug, productId, variantId);
            } else {
                // 2. TypeScript is now 100% sure productId is a string here
                addProduct(tenantSlug, productId, variantId, variantName, quantity);
            }
        },
        [addProduct, removeProduct, isProductInCart, tenantSlug]
    );

    const handleAddProduct = useCallback(
        (productId: string | undefined, variantId?: string, variantName?: string, quantity: number = 1) => {
            if (!productId) return; // Guard clause
            addProduct(tenantSlug, productId, variantId, variantName, quantity);
        },
        [addProduct, tenantSlug]
    );

    const handleRemoveProduct = useCallback(
        (productId: string | undefined, variantId?: string) => {
            if (!productId) return; // Guard clause
            removeProduct(tenantSlug, productId, variantId);
        },
        [removeProduct, tenantSlug]
    );

    const totalQuantity = items.reduce((acc, item) => acc + (item.quantity || 1), 0);

    return {
        items,
        addProduct: handleAddProduct,
        removeProduct: handleRemoveProduct,
        clearCart: () => clearCart(tenantSlug),
        clearAllCarts,
        toggleProduct,
        isProductInCart,
        totalItems: items.length,
        totalQuantity,
    };
};