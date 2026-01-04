import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useCartStore } from "../store/use-cart-store";

export const useCart = (tenantSlug: string) => {
    // Select the whole cart object safely
    const cart = useCartStore(useShallow((state) => 
        state.tenantCarts[tenantSlug] || { items: [] }
    ));
    
    const addProduct = useCartStore((state) => state.addProduct);
    const removeProduct = useCartStore((state) => state.removeProduct);
    const setQuantity = useCartStore((state) => state.setQuantity);
    const clearCart = useCartStore((state) => state.clearCart);

    const items = cart.items;
    const productIds = items.map(item => item.id);

    const updateQuantity = useCallback((productId: string, quantity: number) => {
        setQuantity(tenantSlug, productId, quantity);
    }, [tenantSlug, setQuantity]);

    const toggleProduct = useCallback((productId: string) => {
        const exists = items.some(i => i.id === productId);
        if (exists) {
            removeProduct(tenantSlug, productId);
        } else {
            addProduct(tenantSlug, productId);
        }
    }, [addProduct, removeProduct, items, tenantSlug]);

    const isProductInCart = useCallback((productId: string) => {
        return items.some(i => i.id === productId);
    }, [items]);

    return {
        items, // Array of { id, quantity }
        productIds,
        addProduct: (id: string) => addProduct(tenantSlug, id),
        removeProduct: (id: string) => removeProduct(tenantSlug, id),
        updateQuantity,
        clearCart: () => clearCart(tenantSlug),
        isProductInCart,
        toggleProduct,
        totalItems: items.reduce((acc, item) => acc + item.quantity, 0),
    };
};