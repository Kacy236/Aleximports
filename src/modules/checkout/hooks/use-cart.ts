import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";

import { useCartStore, CartItem } from "../store/use-cart-store";

export const useCart = (tenantSlug: string) => {
    const addProduct = useCartStore((state) => state.addProduct);
    const removeProduct = useCartStore((state) => state.removeProduct);
    const clearCart = useCartStore((state) => state.clearCart);
    const clearAllCarts = useCartStore((state) => state.clearAllCarts);

    // ✅ Now tracking 'items' objects including productId, variantId, and variantName
    const items = useCartStore(
        useShallow(
            (state) =>
                state.tenantCarts[tenantSlug]?.items || []
        )
    );

    const isProductInCart = useCallback(
        (productId: string, variantId?: string) => {
            return items.some(
                (item) => item.productId === productId && item.variantId === variantId
            );
        },
        [items]
    );

    const toggleProduct = useCallback(
        (productId: string, variantId?: string, variantName?: string) => {
            if (isProductInCart(productId, variantId)) {
                removeProduct(tenantSlug, productId, variantId);
            } else {
                // ✅ Pass variantName through toggle
                addProduct(tenantSlug, productId, variantId, variantName);
            }
        },
        [addProduct, removeProduct, isProductInCart, tenantSlug]
    );

    const clearTenantCart = useCallback(() => {
        clearCart(tenantSlug);
    }, [tenantSlug, clearCart]);

    const handleAddProduct = useCallback(
        (productId: string, variantId?: string, variantName?: string) => {
            // ✅ Pass variantName to the store's addProduct
            addProduct(tenantSlug, productId, variantId, variantName);
        },
        [addProduct, tenantSlug]
    );

    const handleRemoveProduct = useCallback(
        (productId: string, variantId?: string) => {
            removeProduct(tenantSlug, productId, variantId);
        },
        [removeProduct, tenantSlug]
    );

    return {
        items, // Returns the array of { productId, variantId, variantName }
        addProduct: handleAddProduct,
        removeProduct: handleRemoveProduct,
        clearCart: clearTenantCart,
        clearAllCarts,
        toggleProduct,
        isProductInCart,
        totalItems: items.length,
    };
};