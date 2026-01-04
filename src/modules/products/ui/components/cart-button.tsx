"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCart } from "@/modules/checkout/hooks/use-cart";
import { useEffect, useState } from "react";

interface Props {
    tenantSlug: string;
    productId: string;
    isPurchased?: boolean;
};

export const CartButton = ({ tenantSlug, productId, isPurchased }: Props) => {
    const [isMounted, setIsMounted] = useState(false);
    
    // ✅ FIX: Pass the tenantSlug to the hook
    const cart = useCart(tenantSlug); 

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <Button variant="elevated" className="flex-1 bg-green-500 opacity-50" disabled>
                Loading...
            </Button>
        );
    }

    if (isPurchased) {
        return (
            <Button 
                variant="elevated"
                className="flex-1 font-medium bg-white"
                disabled
            >
                Purchased
            </Button>
        );
    }

    // ✅ Match the new store properties (items, addItem, removeItem)
    // If your store still uses 'products' instead of 'items', change this to cart.products
    const isInCart = cart.items.some(item => item.id === productId);

    const handleCartAction = () => {
        if (isInCart) {
            cart.removeItem(productId);
        } else {
            // Adding 1 unit by default from the product page
            cart.addItem({ id: productId, quantity: 1 });
        }
    };

    return (
        <Button
          variant="elevated"
          className={cn(
            "flex-1 bg-green-500 hover:bg-green-600 transition-colors", 
            isInCart && "bg-white text-black border border-neutral-200"
          )}
          onClick={handleCartAction}
        >
          {isInCart ? "Remove from cart" : "Add to cart"}
        </Button>
    );
};