import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn, generateTenantURL } from "@/lib/utils";

import { useCart } from "../../hooks/use-cart";
import { ShoppingCartIcon } from "lucide-react";

interface CheckoutButtonProps {
    className?: string;
    hideIfEmpty?: boolean;
    tenantSlug: string;
}

export const CheckoutButton = ({
    className,
    hideIfEmpty,
    tenantSlug,
}: CheckoutButtonProps) => {
    const { totalItems } = useCart(tenantSlug);

    if (hideIfEmpty && totalItems === 0) return null;

    return (
        <Button 
            variant="outline" 
            asChild 
            className={cn(
                "relative bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-900 px-3", 
                className
            )}
        >
            <Link href={`${generateTenantURL(tenantSlug)}/checkout`} className="flex items-center gap-2">
                <ShoppingCartIcon className="size-5" />
                <span className="font-bold">Cart</span>
                
                {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-[10px] font-bold text-white ring-2 ring-white animate-in zoom-in">
                        {totalItems}
                    </span>
                )}
            </Link>
        </Button>
    );
};