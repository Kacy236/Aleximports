import React from "react";
import Link from "next/link";
import Image from "next/image";
import { StarIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { formatCurrency, generateTenantURL } from "@/lib/utils";

interface ProductCardProps {
    id: string;
    name: string;
    imageUrl?: string | null;
    tenantSlug: string;
    tenantImageUrl?: string | null;
    reviewRating: number;
    reviewCount: number;
    price: number;
}

export const ProductCard = ({
    id,
    name,
    imageUrl,
    tenantSlug,
    tenantImageUrl,
    reviewRating,
    reviewCount,
    price,
}: ProductCardProps) => {
    const router = useRouter();

    const handleUserClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        router.push(generateTenantURL(tenantSlug));
    };

    const productHref = `${generateTenantURL(tenantSlug)}/products/${id}`;

    return (
        <Link 
            href={productHref}
            className="group block h-full focus:outline-none focus:ring-4 focus:ring-indigo-500/50 rounded-xl"
        >
            {/* The outer border and shadow are applied here */}
            <div className="border border-gray-300 rounded-xl bg-white overflow-hidden h-full flex flex-col transition-all duration-300 ease-in-out transform group-hover:scale-[1.02] group-hover:shadow-2xl group-hover:border-indigo-500">
                
                {/* 1. Image Section: Reduced height by changing aspect ratio (aspect-[3/4] is taller than wide) */}
                {/* Changing from aspect-square (1:1) to aspect-[4/3] (wider than tall) or a custom ratio like aspect-[16/9] would reduce the height. */}
                <div className="relative aspect-[4/3] overflow-hidden"> 
                    <Image
                        alt={name}
                        fill
                        src={imageUrl || "/placeholder.png"}
                        className="object-cover transition-all duration-500 group-hover:brightness-90"
                    />
                </div>

                {/* 2. Content & Details Section: Padding reduced (p-3 vs p-4) */}
                <div className="p-3 flex flex-col gap-2 flex-1">
                    
                    {/* Product Name: Reduced line-clamp from 2 to 1 (major height saver) */}
                    <h2 className="text-lg font-bold line-clamp-1 text-gray-900 group-hover:text-indigo-600 transition-colors">{name}</h2>
                    
                    {/* Review Rating: Tighter spacing */}
                    {reviewCount > 0 && (
                        <div className="flex items-center gap-1">
                            <StarIcon className="size-3.5 fill-yellow-400 text-yellow-400" />
                            <p className="text-sm font-semibold text-gray-700">
                                {reviewRating} 
                                <span className="text-gray-500 font-normal"> ({reviewCount})</span>
                            </p>
                        </div>
                    )}
                    
                    {/* Tenant Information: Reduced top padding */}
                    <div className="flex items-center gap-2 mt-auto pt-1" onClick={handleUserClick}>
                        {tenantImageUrl && (
                            <Image 
                                alt={tenantSlug}
                                src={tenantImageUrl}
                                width={18} // Slightly smaller
                                height={18}
                                className="rounded-full border border-gray-300 shrink-0 size-[18px] object-cover"
                            />
                        )}
                        <p className="text-xs font-semibold text-gray-600 hover:text-indigo-600 transition-colors cursor-pointer truncate">
                            {tenantSlug}
                        </p>
                    </div>
                </div>
                
                {/* 3. Price Tag Section: Reduced padding and border top */}
                <div className="p-3 pt-2 border-t border-gray-100 flex justify-end">
                    <div className="px-3 py-1 bg-indigo-600 rounded-full shadow-md transition-transform group-hover:scale-105">
                        <p className="text-sm font-extrabold text-white tracking-wide">
                            {formatCurrency(price)}
                        </p>
                    </div>
                </div>
            </div>
        </Link>
    )
}

export const ProductCardSkeleton = () => {
    // Skeleton should match the new card's size and shape (aspect-[4/3] and rounded-xl)
    return (
        <div className="w-full aspect-[4/3] bg-neutral-200 rounded-xl animate-pulse"/>
    )
}