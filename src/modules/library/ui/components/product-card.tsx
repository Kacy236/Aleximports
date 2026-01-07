import React from "react";
import Link from "next/link";
import Image from "next/image";
import { StarIcon } from "lucide-react";

interface ProductCardProps {
    id: string;
    name: string;
    imageUrl?: string | null;
    tenantSlug: string;
    tenantImageUrl?: string | null;
    reviewRating: number;
    reviewCount: number;
}

export const ProductCard = ({
    id,
    name,
    imageUrl,
    tenantSlug,
    tenantImageUrl,
    reviewRating,
    reviewCount,
}: ProductCardProps) => {
    return (
        <Link prefetch href={`/library/${id}`} className="group">
            <div className="hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all border-2 border-black rounded-xl bg-white overflow-hidden h-full flex flex-col">
                <div className="relative aspect-square border-b-2 border-black">
                    <Image
                        alt={name}
                        fill
                        src={imageUrl || "/placeholder.png"}
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                </div>
                <div className="p-4 flex flex-col gap-2 flex-1">
                    <h2 className="text-base font-bold line-clamp-2 leading-tight uppercase tracking-tight">
                        {name}
                    </h2>
                    
                    <div className="flex items-center gap-2 mt-1">
                        {tenantImageUrl && (
                            <div className="relative size-5 shrink-0">
                                <Image 
                                    alt={tenantSlug}
                                    src={tenantImageUrl}
                                    fill
                                    className="rounded-full border border-black object-cover"
                                />
                            </div>
                        )}
                        <p className="text-xs font-bold underline decoration-1 underline-offset-2 opacity-70">
                            {tenantSlug}
                        </p>
                    </div>

                    {reviewCount > 0 && (
                        <div className="flex items-center gap-1 mt-auto pt-2">
                            <StarIcon className="size-3 fill-black" />
                            <p className="text-[11px] font-black uppercase">
                                {reviewRating.toFixed(1)} <span className="opacity-50">({reviewCount})</span>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
};

export const ProductCardSkeleton = () => {
    return (
        <div className="w-full aspect-square bg-neutral-100 border-2 border-neutral-200 rounded-xl animate-pulse flex flex-col">
            <div className="flex-1 bg-neutral-200" />
            <div className="p-4 space-y-2">
                <div className="h-4 w-full bg-neutral-200 rounded" />
                <div className="h-3 w-2/3 bg-neutral-200 rounded" />
            </div>
        </div>
    );
};