"use client";

import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { LinkIcon, StarIcon, CheckIcon } from "lucide-react";
import { formatCurrency, generateTenantURL, cn } from "@/lib/utils";
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
    () => import("../components/cart-button").then(
        (mod) => mod.CartButton,
    ),
    {
        ssr: false,
        loading: () => <Button disabled className="flex-1 bg-green-500">Add to Cart</Button>
    },
);

interface ProductViewProps {
    productId: string;
    tenantSlug: string;
}

export const ProductView = ({ productId, tenantSlug }: ProductViewProps) => {
    const trpc = useTRPC();
    const { data } = useSuspenseQuery(trpc.products.getOne.queryOptions({ id: productId }));

    const [isCopied, setIsCopied] = useState(false);
    
    // --- MULTIPLE IMAGES STATE ---
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const images = data.images || [];
    const currentDisplayImage = images[selectedImageIndex]?.image?.url || "/placeholder.png";

    return (
        <div className="px-4 lg:px-12 py-10">
            <div className="border rounded-sm bg-white overflow-hidden">
                {/* Main Image Display */}
                <div className="relative w-full h-[300px] sm:h-[400px] md:h-[600px] lg:h-[700px] xl:h-[800px] border-b bg-neutral-50">
                    <Image
                        src={currentDisplayImage}
                        alt={data.name}
                        fill
                        className="object-contain"
                        priority
                    />
                </div>

                {/* --- THUMBNAIL STRIP --- */}
                {images.length > 1 && (
                    <div className="flex gap-2 p-4 overflow-x-auto border-b bg-gray-50/50">
                        {images.map((item, index) => (
                            <button
                                key={item.id || index}
                                onClick={() => setSelectedImageIndex(index)}
                                className={cn(
                                    "relative size-20 shrink-0 rounded-md overflow-hidden border-2 transition",
                                    selectedImageIndex === index ? "border-green-500 shadow-sm" : "border-transparent opacity-70 hover:opacity-100"
                                )}
                            >
                                <Image
                                    src={item.image?.url || "/placeholder.png"}
                                    alt={`${data.name} thumbnail ${index + 1}`}
                                    fill
                                    className="object-cover"
                                />
                            </button>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-6">
                    <div className="col-span-4">
                        <div className="p-6">
                            <h1 className="text-4xl font-medium">{data.name}</h1>
                        </div>
                        <div className="border-y flex flex-wrap">
                            <div className="px-6 py-4 flex items-center justify-center border-r">
                                <div className="px-2 py-1 border bg-green-500 w-fit">
                                    <p className="text-base font-medium">{formatCurrency(data.price)}</p>
                                </div>
                            </div>

                            <div className="px-6 py-4 flex items-center justify-center lg:border-r">
                                <Link href={generateTenantURL(tenantSlug)} className="flex items-center gap-2">
                                    {data.tenant.image?.url && (
                                        <Image 
                                          src={data.tenant.image.url}
                                          alt={data.tenant.name}
                                          width={20}
                                          height={20}
                                          className="rounded-full border shrink-0 size-[20px]"
                                        />
                                    )}
                                    <p className="text-base underline font-medium">
                                      {data.tenant.name}  
                                    </p>
                                </Link>
                            </div>

                            <div className="hidden lg:flex px-6 py-4 items-center justify-center">
                                <div className="flex items-center gap-2">
                                    <StarRating
                                      rating={data.reviewRating}
                                      iconClassName="size-4"
                                    />
                                    <p className="text-base font-medium">
                                        {data.reviewCount} ratings
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="block lg:hidden px-6 py-4 items-center justify-center border-b">
                            <div className="flex items-center gap-2">
                                    <StarRating
                                      rating={data.reviewRating}
                                      iconClassName="size-4"
                                    />
                                    <p className="text-base font-medium">
                                        {data.reviewCount} ratings
                                    </p>
                            </div>
                        </div>

                        <div className="p-6">
                            {data.description ? (
                                <RichText data={data.description}/>
                            ): (
                                <p className="font-medium text-muted-foreground italic">
                                    No description provided
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="col-span-2">
                        <div className="border-t lg:border-t-0 lg:border-l h-full">
                            <div className="flex flex-col gap-4 p-6 border-b">
                                <div className="flex flex-row items-center gap-2">
                                      <CartButton
                                        productId={productId}
                                        tenantSlug={tenantSlug}
                                      />
                                    <Button
                                      className="size-12"
                                      variant="elevated"
                                      onClick={() => {
                                          setIsCopied(true);
                                          navigator.clipboard.writeText(window.location.href);
                                          toast.success("URL copied to clipboard")

                                          setTimeout(() => {
                                              setIsCopied(false);
                                          }, 1000);
                                      }}
                                      disabled={isCopied}
                                    >
                                        {isCopied ? <CheckIcon/> : <LinkIcon />}
                                    </Button>
                                </div>

                                <p className="text-center font-medium">
                                    {/* ✅ FIX: Optional chaining and nullish coalescing for refundPolicy */}
                                    {data.refundPolicy === "no-refunds"
                                      ? "No refunds"
                                      : `${data.refundPolicy?.replace('-',' ') ?? 'Standard'} money back guarantee`
                                    }
                                </p>
                            </div>

                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-medium">Ratings</h3>
                                    <div className="flex items-center gap-x-1 font-medium">
                                        <StarIcon className="size-4 fill-black" />
                                        <p>({data.reviewRating.toFixed(1)})</p>
                                        <p className="text-base">{data.reviewCount} ratings</p>
                                    </div>
                                </div>
                                <div
                                  className="grid grid-cols-[auto_1fr_auto] gap-3 mt-4"
                                >
                                {[5, 4, 3, 2, 1].map((stars) => (
                                    <Fragment key={stars}>
                                        <div className="font-medium">{stars} {stars === 1 ? "star" : "stars"}</div>
                                        {/* ✅ FIX: Added null safety for ratingDistribution lookup */}
                                        <Progress 
                                          value={data.ratingDistribution?.[stars] ?? 0}
                                          className="h-[1lh]"
                                        />
                                        <div className="font-medium">
                                            {data.ratingDistribution?.[stars] ?? 0}%
                                        </div>
                                    </Fragment>
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

export const ProductViewSkeleton = () => {
    return (
        <div className="px-4 lg:px-12 py-10">
          <div className="border rounded-sm bg-white overflow-hidden">
              <div className="relative aspect-video border-b bg-neutral-200 animate-pulse" />
              <div className="p-6 space-y-4">
                  <div className="h-10 w-1/3 bg-neutral-200 rounded animate-pulse" />
                  <div className="h-20 w-full bg-neutral-200 rounded animate-pulse" />
              </div>
          </div>
        </div>
    )
}