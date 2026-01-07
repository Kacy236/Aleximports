import Link from "next/link";
import Image from "next/image";

import { cn, formatCurrency } from "@/lib/utils";

interface CheckoutItemProps {
    isLast?: boolean;
    imageUrl?: string | null;
    name: string;
    /* ✅ THE FIX: Add variantName to the interface */
    variantName?: string; 
    productUrl: string;
    tenantUrl: string;
    tenantName: string;
    price: number;
    onRemove: () => void;
};

export const CheckoutItem = ({
    isLast,
    imageUrl,
    name,
    variantName, // ✅ Destructure the new prop
    productUrl,
    tenantUrl,
    tenantName,
    price,
    onRemove,
}: CheckoutItemProps) => {
    return (
        <div
            className={cn(
                "grid grid-cols-[8.5rem_1fr_auto] gap-4 pr-4 border-b",
                isLast && "border-b-0"
            )}
        >
            <div className="overflow-hidden border-r">
                <div className="relative aspect-square h-full">
                    <Image
                        src={imageUrl || "/placeholder.png"}
                        alt={name}
                        fill
                        className="object-cover"
                    />
                </div>
            </div>

            <div className="py-4 flex flex-col justify-between">
                <div className="space-y-1">
                    <Link href={productUrl}>
                        <h4 className="font-bold underline leading-tight">{name}</h4>
                    </Link>
                    
                    {/* ✅ THE FIX: Render the variant name if it exists */}
                    {variantName && (
                        <p className="text-sm font-medium text-neutral-500">
                            Option: {variantName}
                        </p>
                    )}

                    <Link href={tenantUrl}>
                        <p className="text-xs font-medium text-neutral-400 underline">{tenantName}</p>
                    </Link>
                </div>
            </div>

            <div className="py-4 flex flex-col justify-between items-end">
                <p className="font-bold">
                    {formatCurrency(price)}
                </p>
                <button
                    className="text-sm text-red-600 hover:text-red-700 underline font-medium cursor-pointer transition-colors"
                    onClick={onRemove}
                    type="button"
                >
                    Remove
                </button>
            </div>
        </div>
    );
};