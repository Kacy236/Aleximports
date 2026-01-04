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
    // 1. Add mounting state to prevent Hydration Error
    const [isMounted, setIsMounted] = useState(false);
    
    // 2. Access the new store structure
    const cart = useCart(); 

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // While the server is rendering, or before the client is ready, show a placeholder
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

    // ✅ CHECK: Use the updated 'items' array from our new Zustand store
    const isInCart = cart.items.some(item => item.id === productId);

    const handleCartAction = () => {
        if (isInCart) {
            cart.removeItem(productId);
        } else {
            // We default to 1 when adding from the Product View
            cart.addItem({ id: productId, quantity: 1 });
        }
    };

    return (
        <Button
          variant="elevated"
          className={cn("flex-1 bg-green-500", isInCart && "bg-white text-black border")}
          onClick={handleCartAction}
        >
          {isInCart ? "Remove from cart" : "Add to cart"}
        </Button>
    );
};