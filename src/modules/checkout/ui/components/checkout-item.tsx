import Link from "next/link";
import Image from "next/image";
import { MinusIcon, PlusIcon } from "lucide-react";

import { cn, formatCurrency } from "@/lib/utils";

interface CheckoutItemProps {
    isLast?: boolean;
    imageUrl?: string | null;
    name: string;
    productUrl: string;
    tenantUrl: string;
    tenantName: string;
    price: number;
    quantity: number; // Added
    onRemove: () => void;
    onIncrease: () => void; // Added
    onDecrease: () => void; // Added
};

export const CheckoutItem = ({
    isLast,
    imageUrl,
    name,
    productUrl,
    tenantUrl,
    tenantName,
    price,
    quantity,
    onRemove,
    onIncrease,
    onDecrease,
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
                <div>
                    <Link href={productUrl}>
                        <h4 className="font-bold underline">{name}</h4>
                    </Link>
                    <Link href={tenantUrl}>
                        <p className="font-medium underline">{tenantName}</p>
                    </Link>
                </div>
            </div>

            <div className="py-4 flex flex-col justify-between items-end">
                <p className="font-medium text-right">
                    {formatCurrency(price)}
                </p>

                {/* Quantity Selector UI */}
                <div className="flex items-center gap-x-2 bg-neutral-100 rounded-md p-1 my-2">
                    <button 
                        onClick={onDecrease}
                        type="button"
                        disabled={quantity <= 1}
                        className="p-1 hover:text-green-600 disabled:opacity-30 transition-colors cursor-pointer"
                    >
                        <MinusIcon className="size-4" />
                    </button>
                    
                    <span className="min-w-[1.5rem] text-center font-bold select-none">
                        {quantity}
                    </span>

                    <button 
                        onClick={onIncrease}
                        type="button"
                        className="p-1 hover:text-green-600 transition-colors cursor-pointer"
                    >
                        <PlusIcon className="size-4" />
                    </button>
                </div>

                <button 
                    className="underline text-sm font-medium cursor-pointer text-muted-foreground hover:text-red-500 transition-colors" 
                    onClick={onRemove} 
                    type="button"
                >
                    Remove
                </button>
            </div>
        </div>
    )
};