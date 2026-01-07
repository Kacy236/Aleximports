"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCart } from "@/modules/checkout/hooks/use-cart";
import { useEffect, useState } from "react";

interface Props {
    tenantSlug: string;
    productId: string;
    variantId?: string; // ✅ ADDED: This fixes the "variantId does not exist on type Props" error
    isPurchased?: boolean;
    disabled?: boolean; // Added for better UX control
};

export const CartButton = ({ tenantSlug, productId, variantId, isPurchased, disabled }: Props) => {
    const [isMounted, setIsMounted] = useState(false);
    
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

    // ✅ CHECK: Use both productId and variantId to check if THIS specific version is in cart
    const isInCart = cart.isProductInCart(productId, variantId);

    const handleCartAction = () => {
        if (isInCart) {
            cart.removeProduct(productId, variantId);
        } else {
            // ✅ PASS VARIANT: Now the cart store knows exactly which color/size to add
            cart.addProduct(productId, variantId);
        }
    };

    return (
        <Button
          variant="elevated"
          disabled={disabled}
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