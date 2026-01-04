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
            variant="elevated" 
            asChild 
            className={cn(
                "bg-white cursor-pointer transition-all duration-200",
                "hover:text-green-500 hover:border-green-500", 
                className
            )}
        >
            <Link href={`${generateTenantURL(tenantSlug)}/checkout`} className="flex items-center gap-x-2">
                <div className="relative">
                    <ShoppingCartIcon className="size-5" />
                    {totalItems > 0 && (
                        <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold size-4 flex items-center justify-center rounded-full border border-white">
                            {totalItems}
                        </span>
                    )}
                </div>
                <span className="font-medium">
                    {totalItems > 0 ? "Cart" : "Empty Cart"}
                </span>
            </Link>
        </Button>
    );
};