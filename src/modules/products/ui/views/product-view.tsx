"use client";

import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { LinkIcon, StarIcon, CheckIcon } from "lucide-react";
import { formatCurrency, generateTenantURL } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { Progress } from "@/components/ui/progress";

const CartButton = dynamic(
  () => import("../components/cart-button").then((mod) => mod.CartButton),
  {
    ssr: false,
    loading: () => (
      <Button disabled className="flex-1 bg-green-500">
        Add to Cart
      </Button>
    ),
  }
);

interface ProductViewProps {
  productId: string;
  tenantSlug: string;
}

export const ProductView = ({ productId, tenantSlug }: ProductViewProps) => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.products.getOne.queryOptions({ id: productId })
  );

  const [isCopied, setIsCopied] = useState(false);

  return (
    <div className="px-4 lg:px-12 py-10">
      {/* === HERO IMAGE – BIG & BEAUTIFUL === */}
      <div className="relative -mx-4 lg:-mx-12 -mt-10 mb-10 overflow-hidden rounded-b-3xl shadow-2xl">
        <div className="relative aspect-[16/9] sm:aspect-[21/10] lg:aspect-[24/9]">
          <Image
            src={data.image?.url || "/placeholder-product.png"}
            alt={data.name}
            fill
            priority
            sizes="100vw"
            className="object-cover brightness-95"
          />
          {/* Subtle dark gradient overlay (makes text pop if added later) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        </div>
      </div>

      {/* === MAIN CONTENT CARD === */}
      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-0">
          {/* LEFT: Product Info */}
          <div className="col-span-4">
            <div className="p-6 lg:p-8">
              <h1 className="text-3xl lg:text-4xl font-semibold text-gray-900">
                {data.name}
              </h1>
            </div>

            {/* Price + Seller + Rating Row */}
            <div className="border-y flex flex-col lg:flex-row">
              <div className="px-6 py-5 flex items-center justify-center border-b lg:border-b-0 lg:border-r">
                <div className="px-4 py-2 bg-green-500 rounded-md">
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(data.price)}
                  </p>
                </div>
              </div>

              <div className="px-6 py-5 flex items-center justify-center border-b lg:border-b-0 lg:border-r">
                <Link
                  href={generateTenantURL(tenantSlug)}
                  className="flex items-center gap-3 hover:underline"
                >
                  {data.tenant.image?.url && (
                    <Image
                      src={data.tenant.image.url}
                      alt={data.tenant.name}
                      width={28}
                      height={28}
                      className="rounded-full border-2 border-white shadow-sm size-7"
                    />
                  )}
                  <span className="font-medium text-lg">{data.tenant.name}</span>
                </Link>
              </div>

              <div className="px-6 py-5 flex items-center justify-center">
                <div className="flex items-center gap-3">
                  <StarRating rating={data.reviewRating} iconClassName="size-5" />
                  <span className="font-medium text-lg">
                    {data.reviewCount} ratings
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="p-6 lg:p-8 border-t lg:border-t-0">
              {data.description ? (
                <div className="prose prose-lg max-w-none text-gray-700">
                  <RichText data={data.description} />
                </div>
              ) : (
                <p className="italic text-muted-foreground">
                  No description provided.
                </p>
              )}
            </div>
          </div>

          {/* RIGHT: Sidebar (Cart + Ratings) */}
          <div className="col-span-2 border-t lg:border-t-0 lg:border-l">
            <div className="p-6 lg:p-8 space-y-8">
              {/* Add to Cart + Share */}
              <div className="flex gap-3">
                <CartButton productId={productId} tenantSlug={tenantSlug} />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied!");
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  }}
                >
                  {isCopied ? <CheckIcon className="size-5" /> : <LinkIcon className="size-5" />}
                </Button>
              </div>

              {/* Refund Policy */}
              <p className="text-center text-sm font-medium text-gray-600">
                {data.refundPolicy === "no-refunds"
                  ? "No refunds"
                  : `${data.refundPolicy.replace("-", " ")} money-back guarantee`}
              </p>

              {/* Ratings Breakdown */}
              <div className="pt-6 border-t">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Customer Ratings</h3>
                  <div className="flex items-center gap-2">
                    <StarIcon className="size-5 fill-yellow-500 text-yellow-500" />
                    <span className="font-bold text-lg">({data.reviewRating})</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((stars) => (
                    <div key={stars} className="flex items-center gap-3 text-sm">
                      <span className="w-12 text-right font-medium">{stars} ★</span>
                      <Progress
                        value={data.ratingDistribution[stars]}
                        className="flex-1 h-2"
                      provis/>
                      <span className="w-12 text-left font-medium">
                        {data.ratingDistribution[stars]}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Updated Skeleton with matching big image
export const ProductViewSkeleton = () => {
  return (
    <div className="px-4 lg:px-12 py-10">
      {/* Hero Image Skeleton */}
      <div className="relative -mx-4 lg:-mx-12 -mt-10 mb-10 overflow-hidden rounded-b-3xl">
        <div className="aspect-[16/9] sm:aspect-[21/10] lg:aspect-[24/9] bg-gray-200 animate-pulse" />
      </div>

      {/* Card Skeleton */}
      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-6">
          <div className="col-span-4 p-8 space-y-6">
            <div className="h-10 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="flex gap-6">
              <div className="h-12 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-12 w-48 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse" />
            </div>
          </div>
          <div className="col-span-2 border-t lg:border-l p-8">
            <div className="h-12 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};