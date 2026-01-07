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
        <Link prefetch href={`/library/${id}`} className="group block h-full rounded-xl">
            <div className="border border-gray-500 rounded-xl bg-white overflow-hidden h-full flex flex-col transition-all duration-300 ease-in-out transform group-hover:scale-[1.02] group-hover:shadow-2xl group-hover:border-green-500">
                
                {/* 1. Image Section: aspect-[4/3] matches your reference */}
                <div className="relative aspect-[4/3] overflow-hidden"> 
                    <Image
                        alt={name}
                        fill
                        src={imageUrl || "/placeholder.png"}
                        className="object-cover transition-all duration-500 group-hover:brightness-90"
                    />
                </div>

                {/* 2. Content Section */}
                <div className="p-4 flex flex-col gap-3 flex-1">
                    <h2 className="text-lg font-bold line-clamp-1 text-gray-900 transition-colors">
                        {name}
                    </h2>
                    
                    <div className="flex items-center gap-1.5 mt-auto pt-2">
                        {tenantImageUrl && (
                            <Image 
                                alt={tenantSlug}
                                src={tenantImageUrl}
                                width={20}
                                height={20}
                                className="rounded-full border border-gray-300 shrink-0 size-[20px] object-cover"
                            />
                        )}
                        <p className="text-sm font-semibold text-gray-600 underline underline-offset-2 truncate">
                            {tenantSlug}
                        </p>
                    </div>
                </div>
                
                {/* 3. Footer Section: Rating Chip only (Library usually doesn't show price) */}
                <div className="p-4 pt-3 border-t border-gray-300 flex items-center justify-between min-h-[58px]">
                    {reviewCount > 0 ? (
                        <div className="flex items-center gap-1 shrink-0 bg-gray-200 px-2 py-0.5 rounded-md border border-gray-300">
                            <StarIcon className="size-3.5 fill-yellow-400 text-yellow-400" />
                            <p className="text-xs font-medium text-gray-900">
                                {reviewRating} 
                                <span className="text-gray-600 ml-1 font-normal">({reviewCount})</span>
                            </p>
                        </div>
                    ) : (
                        <span className="text-xs text-gray-400 italic">No reviews yet</span>
                    )}
                    
                    {/* Visual balance element to match store card layout */}
                    <div className="text-[10px] font-bold text-green-600 uppercase tracking-tight">
                        Purchased
                    </div>
                </div>
            </div>
        </Link>
    );
};

export const ProductCardSkeleton = () => {
    return (
        <div className="w-full aspect-[4/3] bg-neutral-200 rounded-xl animate-pulse"/>
    );
};