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
    
    // Pass the tenantSlug as required by your hook
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

    // ✅ FIX: Using the function your store actually provides
    const isInCart = cart.isProductInCart(productId);

    const handleCartAction = () => {
        if (isInCart) {
            // ✅ FIX: Use removeProduct instead of removeItem
            cart.removeProduct(productId);
        } else {
            // ✅ FIX: Use addProduct instead of addItem
            // Note: Your store's addProduct takes a string (id), not an object
            cart.addProduct(productId);
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