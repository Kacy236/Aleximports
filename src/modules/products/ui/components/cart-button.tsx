"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCart } from "@/modules/checkout/hooks/use-cart";
import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";

interface Props {
    tenantSlug: string;
    productId: string;
    /** ✅ The specific ID for the chosen variant */
    variantId?: string; 
    /** ✅ The human-readable name (e.g., "Blue / XL") to be stored in the order */
    variantName?: string; 
    isPurchased?: boolean;
    disabled?: boolean;
};

export const CartButton = ({ 
    tenantSlug, 
    productId, 
    variantId, 
    variantName, 
    isPurchased, 
    disabled 
}: Props) => {
    const [isMounted, setIsMounted] = useState(false);
    
    const cart = useCart(tenantSlug); 

    // Handle hydration to prevent mismatch between server and client HTML
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

    /** * ✅ CHECK: uses both IDs to determine if this exact 
     * version of the product is already in the cart.
     */
    const isInCart = cart.isProductInCart(productId, variantId);

    const handleCartAction = () => {
        if (isInCart) {
            cart.removeProduct(productId, variantId);
        } else {
            /** * ✅ THE FIX: We now pass the variantName. 
             * This travels: Button -> Hook -> Store -> Checkout -> Paystack -> Webhook -> Database.
             */
            cart.addProduct(productId, variantId, variantName);
        }
    };

    return (
        <Button
          variant="elevated"
          disabled={disabled}
          className={cn(
            "flex-1 bg-green-500 hover:bg-green-600 transition-colors font-semibold", 
            isInCart && "bg-white text-black border border-neutral-200 hover:bg-neutral-50"
          )}
          onClick={handleCartAction}
        >
            <ShoppingCart size={20} />
          {isInCart ? "Remove from cart" : "Add to cart"}
        </Button>
    );
};