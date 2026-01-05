"use client";

import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { LinkIcon, StarIcon, CheckIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency, generateTenantURL, cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState, useMemo, Fragment, useEffect } from "react";
import { RichText } from "@payloadcms/richtext-lexical/react";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Media, Tenant } from "@/payload-types";

// Dynamic import with SSR disabled is crucial for components using Browser Stores
const CartButton = dynamic(
    () => import("../components/cart-button").then((mod) => mod.CartButton),
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
    // --- HYDRATION FIX ---
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const trpc = useTRPC();
    const { data } = useSuspenseQuery(trpc.products.getOne.queryOptions({ id: productId }));

    const [isCopied, setIsCopied] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // --- DEFENSIVE DATA EXTRACTION ---
    const images = useMemo(() => data?.images || [], [data?.images]);
    
    const currentDisplayImage = useMemo(() => {
        const imgObj = images[selectedImageIndex]?.image;
        if (imgObj && typeof imgObj === "object" && "url" in imgObj && imgObj.url) {
            return imgObj.url;
        }
        return "/placeholder.png";
    }, [images, selectedImageIndex]);

    const tenant = data?.tenant as Tenant | undefined;
    const tenantImage = tenant?.image as Media | undefined;

    const nextImage = () => {
        if (images.length <= 1) return;
        setSelectedImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        if (images.length <= 1) return;
        setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    // --- RENDER GUARD ---
    if (!isMounted) {
        return <ProductViewSkeleton />;
    }

    if (!data) return null;

    return (
        <div className="px-4 lg:px-12 py-10">
            <div className="border rounded-sm bg-white overflow-hidden">
                {/* Main Image Display */}
                <div className="relative group w-full h-[300px] sm:h-[400px] md:h-[600px] lg:h-[700px] xl:h-[800px] border-b bg-neutral-50">
                    <Image
                        src={currentDisplayImage}
                        alt={data.name || "Product Image"}
                        fill
                        className="object-contain"
                        priority
                    />

                    {images.length > 1 && (
                        <>
                            <button 
                                onClick={prevImage}
                                className={cn(
                                    "absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 rounded-full shadow-lg transition-all duration-200",
                                    "bg-white/90 border border-neutral-200", // Background/Border visible on mobile
                                    "lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100", // Hidden only on large screens until hover
                                    "cursor-pointer hover:bg-white hover:text-green-500 hover:scale-110 border border-transparent hover:border-green-500/20"
                                )}
                                aria-label="Previous image"
                            >
                                <ChevronLeft className="size-5 sm:size-6 transition-colors" />
                            </button>
                            <button 
                                onClick={nextImage}
                                className={cn(
                                    "absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 rounded-full shadow-lg transition-all duration-200",
                                    "bg-white/90 border border-neutral-200", // Background/Border visible on mobile
                                    "lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100", // Hidden only on large screens until hover
                                    "cursor-pointer hover:bg-white hover:text-green-500 hover:scale-110 border border-transparent hover:border-green-500/20"
                                )}
                                aria-label="Next image"
                            >
                                <ChevronRight className="size-5 sm:size-6 transition-colors" />
                            </button>
                            
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-md border border-white/20">
                                {selectedImageIndex + 1} / {images.length}
                            </div>
                        </>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-6">
                    <div className="col-span-4">
                        <div className="p-6">
                            <h1 className="text-4xl font-medium">{data.name}</h1>
                        </div>
                        <div className="border-y flex flex-wrap">
                            <div className="px-6 py-4 flex items-center justify-center border-r">
                                <div className="px-2 py-1 border bg-green-500 w-fit">
                                    <p className="text-base font-medium">
                                        {formatCurrency(Number(data.price || 0))}
                                    </p>
                                </div>
                            </div>

                            <div className="px-6 py-4 flex items-center justify-center lg:border-r">
                                <Link href={generateTenantURL(tenantSlug)} className="flex items-center gap-2">
                                    {tenantImage?.url && (
                                        <Image 
                                          src={tenantImage.url}
                                          alt={tenant?.name || "Store"}
                                          width={20}
                                          height={20}
                                          className="rounded-full border shrink-0 size-[20px]"
                                        />
                                    )}
                                    <p className="text-base underline font-medium">
                                      {tenant?.name || "Store"}  
                                    </p>
                                </Link>
                            </div>

                            <div className="hidden lg:flex px-6 py-4 items-center justify-center">
                                <div className="flex items-center gap-2">
                                    <StarRating
                                      rating={data.reviewRating ?? 0}
                                      iconClassName="size-4"
                                    />
                                    <p className="text-base font-medium">
                                        {data.reviewCount ?? 0} ratings
                                    </p>
                                </div>
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
                                          setTimeout(() => setIsCopied(false), 1000);
                                      }}
                                      disabled={isCopied}
                                    >
                                        {isCopied ? <CheckIcon/> : <LinkIcon />}
                                    </Button>
                                </div>

                                <p className="text-center font-medium">
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
                                        <p>({(data.reviewRating ?? 0).toFixed(1)})</p>
                                        <p className="text-base">{data.reviewCount ?? 0} ratings</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-[auto_1fr_auto] gap-3 mt-4">
                                {[5, 4, 3, 2, 1].map((stars) => (
                                    <Fragment key={stars}>
                                        <div className="font-medium">{stars} {stars === 1 ? "star" : "stars"}</div>
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
              <div className="relative w-full h-[500px] border-b bg-neutral-100 animate-pulse" />
              <div className="p-6 space-y-4">
                  <div className="h-10 w-1/3 bg-neutral-100 rounded animate-pulse" />
                  <div className="h-20 w-full bg-neutral-100 rounded animate-pulse" />
              </div>
          </div>
        </div>
    )
}