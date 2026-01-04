import React from "react";
import Link from "next/link";
import Image from "next/image";
import { StarIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { formatCurrency, generateTenantURL } from "@/lib/utils";

interface MediaImage {
  url: string;
}

interface ProductCardProps {
  id: string;
  name: string;
  images?: MediaImage[] | null; // ✅ MULTIPLE IMAGES
  tenantSlug: string;
  tenantImageUrl?: string | null;
  reviewRating: number;
  reviewCount: number;
  price: number;
}

export const ProductCard = ({
  id,
  name,
  images,
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

  // ✅ First image = main product image
  const mainImageUrl = images?.[0]?.url || "/placeholder.png";

  return (
    <Link
      href={productHref}
      className="group block h-full focus:outline-none focus:ring-4 focus:ring-green-500/50 rounded-xl"
    >
      <div className="border border-gray-500 rounded-xl bg-white overflow-hidden h-full flex flex-col transition-all duration-300 ease-in-out transform group-hover:scale-[1.02] group-hover:shadow-2xl group-hover:border-green-500">
        
        {/* 1. Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={mainImageUrl}
            alt={name} // ✅ NOT using media.alt
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-all duration-500 group-hover:brightness-90"
          />
        </div>

        {/* 2. Content Section */}
        <div className="p-4 flex flex-col gap-3 flex-1">
          <h2 className="text-lg font-bold line-clamp-1 text-gray-900">
            {name}
          </h2>

          {/* Tenant Info */}
          <div
            className="flex items-center gap-1.5 mt-auto pt-2"
            onClick={handleUserClick}
          >
            {tenantImageUrl && (
              <Image
                src={tenantImageUrl}
                alt={tenantSlug}
                width={20}
                height={20}
                className="rounded-full border border-gray-300 size-[20px] object-cover"
              />
            )}

            <p className="text-sm font-semibold text-gray-600 hover:text-green-600 underline underline-offset-2 transition-colors cursor-pointer truncate">
              {tenantSlug}
            </p>
          </div>
        </div>

        {/* 3. Footer Section */}
        <div className="p-4 pt-3 border-t border-gray-300 flex items-center justify-between">
          {reviewCount > 0 ? (
            <div className="flex items-center gap-1 bg-gray-200 px-2 py-0.5 rounded-md border border-gray-300">
              <StarIcon className="size-3.5 fill-yellow-400 text-yellow-400" />
              <p className="text-xs font-medium text-gray-900">
                {reviewRating}
                <span className="text-gray-600 ml-1 font-normal">
                  ({reviewCount})
                </span>
              </p>
            </div>
          ) : (
            <div />
          )}

          <div className="px-4 py-1.5 bg-green-600 rounded-full shadow-md transition-transform group-hover:scale-105">
            <p className="text-sm font-extrabold text-white tracking-wide">
              {formatCurrency(price)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export const ProductCardSkeleton = () => {
  return (
    <div className="w-full aspect-[4/3] bg-neutral-200 rounded-xl animate-pulse rounded-xl" />
  );
};
