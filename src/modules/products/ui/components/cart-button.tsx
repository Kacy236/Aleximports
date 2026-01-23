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
    /** ✅ Pass the quantity from the ProductView state */
    quantity?: number;
    isPurchased?: boolean;
    disabled?: boolean;
};

export const CartButton = ({ 
    tenantSlug, 
    productId, 
    variantId, 
    variantName, 
    quantity = 1, // Default to 1 if not provided
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
            <Button 
                variant="elevated" 
                className="flex-1 bg-green-500 opacity-50 h-14" 
                disabled
            >
                <ShoppingCart size={20} className="mr-2" />
                Loading...
            </Button>
        );
    }

    if (isPurchased) {
        return (
            <Button 
                variant="elevated"
                className="flex-1 font-black uppercase bg-white border-2 border-black h-14 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
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
            /** * ✅ THE FIX: We now pass the variantName AND the quantity. 
             * This ensures the hook adds the correct amount to the store.
             */
            cart.addProduct(productId, variantId, variantName, quantity);
        }
    };

    return (
        <Button
          variant="elevated"
          disabled={disabled}
          className={cn(
            "flex-1 h-14 text-sm font-black uppercase tracking-tight transition-all flex items-center justify-center gap-2 border-2 border-black", 
            isInCart 
                ? "bg-white text-black hover:bg-neutral-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]" 
                : "bg-green-500 hover:bg-green-600 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
          )}
          onClick={handleCartAction}
        >
            <ShoppingCart size={20} />
            {isInCart ? "Remove from cart" : "Add to cart"}
        </Button>
    );
};