"use client";

import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { LinkIcon, StarIcon, CheckIcon, ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";
import { formatCurrency, generateTenantURL, cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState, useMemo, useEffect, Fragment, useCallback } from "react";
import { RichText } from "@payloadcms/richtext-lexical/react";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Media, Tenant } from "@/payload-types";

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
    const [isMounted, setIsMounted] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const trpc = useTRPC();
    const { data } = useSuspenseQuery(trpc.products.getOne.queryOptions({ id: productId }));

    const [isCopied, setIsCopied] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);

    const images = useMemo(() => data?.images || [], [data?.images]);

    // --- NAVIGATION LOGIC ---
    const nextImage = useCallback(() => {
        if (images.length <= 1) return;
        setSelectedImageIndex((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const prevImage = useCallback(() => {
        if (images.length <= 1) return;
        setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    // --- KEYBOARD & SCROLL LOCK ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isLightboxOpen) return;
            if (e.key === "ArrowRight") nextImage();
            if (e.key === "ArrowLeft") prevImage();
            if (e.key === "Escape") setIsLightboxOpen(false);
        };

        if (isLightboxOpen) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleKeyDown);
        } else {
            document.body.style.overflow = "unset";
        }

        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isLightboxOpen, nextImage, prevImage]);

    // --- IMAGE LOGIC ---
    const activeVariant = useMemo(() => {
        if (!data?.hasVariants || !data?.variants) return null;
        return data.variants.find((v: any) => {
            const colorMatch = selectedColor ? v.color === selectedColor : true;
            const sizeMatch = selectedSize ? v.size === selectedSize : true;
            return colorMatch && sizeMatch;
        });
    }, [data?.variants, data?.hasVariants, selectedColor, selectedSize]);

    const currentDisplayImage = useMemo(() => {
        if (!data) return "/placeholder.png";
        const variantImg = activeVariant?.variantImage as Media | undefined;
        if (variantImg?.url) return variantImg.url;
        if (images.length === 0) return "/placeholder.png";
        const imgObj = images[selectedImageIndex]?.image;
        if (imgObj && typeof imgObj === "object" && "url" in imgObj && imgObj.url) {
            return imgObj.url;
        }
        return "/placeholder.png";
    }, [data, images, selectedImageIndex, activeVariant]);

    // ... (Keep existing Variant/Price/Tenant logic same as before)
    const allPossibleColors = useMemo(() => {
        if (!data?.hasVariants || !data?.variants) return [];
        const colors = data.variants.map((v: any) => v.color).filter(Boolean);
        return Array.from(new Set(colors)) as string[];
    }, [data?.variants, data?.hasVariants]);

    const allPossibleSizes = useMemo(() => {
        if (!data?.hasVariants || !data?.variants) return [];
        const sizes = data.variants.map((v: any) => v.size).filter(Boolean);
        return Array.from(new Set(sizes)) as string[];
    }, [data?.variants, data?.hasVariants]);

    const availableColors = useMemo(() => {
        if (!selectedSize) return allPossibleColors;
        return data?.variants?.filter((v: any) => v.size === selectedSize).map((v: any) => v.color) || [];
    }, [selectedSize, data?.variants, allPossibleColors]);

    const availableSizes = useMemo(() => {
        if (!selectedColor) return allPossibleSizes;
        return data?.variants?.filter((v: any) => v.color === selectedColor).map((v: any) => v.size) || [];
    }, [selectedColor, data?.variants, allPossibleSizes]);

    const currentPrice = useMemo(() => {
        if (activeVariant?.variantPrice) return activeVariant.variantPrice;
        return data?.price || 0;
    }, [activeVariant, data?.price]);

    const tenant = data?.tenant as (Tenant & { image?: Media }) | undefined;
    const tenantImage = tenant?.image;

    if (!isMounted) return <ProductViewSkeleton />;
    if (!data) return null;

    return (
        <div className="px-4 lg:px-12 py-10">
            {/* --- ENHANCED LIGHTBOX OVERLAY --- */}
            {isLightboxOpen && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
                    {/* Close Button */}
                    <button 
                        className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2 z-[110]"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <X size={40} />
                    </button>

                    {/* Lightbox Navigation - Only if multiple images */}
                    {images.length > 1 && (
                        <>
                            <button 
                                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-4 z-[110] transition-all hover:scale-110"
                            >
                                <ChevronLeft size={48} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-4 z-[110] transition-all hover:scale-110"
                            >
                                <ChevronRight size={48} />
                            </button>
                        </>
                    )}
                    
                    {/* Fullscreen Image Container */}
                    <div 
                        className="relative w-full h-full max-w-6xl max-h-[85vh] mx-4 cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            nextImage(); // Clicking image also advances
                        }}
                    >
                        <Image
                            src={currentDisplayImage}
                            alt={data?.name || "Full screen view"}
                            fill
                            className="object-contain select-none"
                            quality={100}
                        />
                    </div>
                    
                    {/* Footer / Counter */}
                    <div className="mt-6 text-center select-none">
                        <p className="text-white font-medium text-lg">{data.name}</p>
                        <p className="text-white/40 text-sm mt-1">
                            Use arrow keys to navigate — {selectedImageIndex + 1} / {images.length}
                        </p>
                    </div>
                </div>
            )}

            <div className="border rounded-sm bg-white overflow-hidden">
                <div className="relative group w-full h-[300px] sm:h-[400px] md:h-[600px] lg:h-[700px] xl:h-[800px] border-b bg-neutral-50">
                    {/* Main Image Trigger */}
                    <div 
                        className="relative w-full h-full cursor-zoom-in"
                        onClick={() => setIsLightboxOpen(true)}
                    >
                        <Image
                            src={currentDisplayImage}
                            alt={data?.name || "Product Image"}
                            fill
                            className="object-contain transition-opacity duration-300"
                            priority
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5">
                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full border border-white/30">
                                <Maximize2 className="text-white size-6 drop-shadow-md" />
                            </div>
                        </div>
                    </div>

                    {images.length > 1 && (
                        <>
                            <button 
                                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                className={cn(
                                    "absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 rounded-full shadow-lg transition-all duration-150",
                                    "bg-white/90 border border-neutral-200 text-neutral-900", 
                                    "lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100",
                                    "cursor-pointer hover:bg-white lg:hover:scale-110 lg:hover:text-green-600"
                                )}
                            >
                                <ChevronLeft className="size-5 sm:size-6" />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                className={cn(
                                    "absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 rounded-full shadow-lg transition-all duration-150",
                                    "bg-white/90 border border-neutral-200 text-neutral-900",
                                    "lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100",
                                    "cursor-pointer hover:bg-white lg:hover:scale-110 lg:hover:text-green-600"
                                )}
                            >
                                <ChevronRight className="size-5 sm:size-6" />
                            </button>
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-md border border-white/20">
                                {selectedImageIndex + 1} / {images.length}
                            </div>
                        </>
                    )}
                </div>

                {/* ... (Keep the rest of your original Grid/Variants/Sidebar code exactly as it was) ... */}
                <div className="grid grid-cols-1 lg:grid-cols-6">
                    <div className="col-span-4">
                        <div className="p-6">
                            <h1 className="text-4xl font-medium">{data.name}</h1>
                        </div>
                        <div className="border-y flex flex-wrap">
                            <div className="px-6 py-4 flex items-center justify-center border-r">
                                <div className="px-3 py-1 border bg-green-500 rounded-sm">
                                    <p className="text-base font-bold text-white">
                                        {formatCurrency(Number(currentPrice))}
                                    </p>
                                </div>
                            </div>

                            <div className="px-6 py-4 flex items-center justify-center lg:border-r">
                                <Link href={generateTenantURL(tenantSlug)} className="flex items-center gap-2 group/tenant cursor-pointer">
                                    {tenantImage?.url && (
                                        <Image 
                                          src={tenantImage.url}
                                          alt={tenant?.name || "Store"}
                                          width={24}
                                          height={24}
                                          className="rounded-full border shrink-0 size-[24px]"
                                        />
                                    )}
                                    <p className="text-base font-medium underline underline-offset-4 decoration-2 decoration-neutral-400 group-hover/tenant:decoration-green-600 transition-colors">
                                      {tenant?.name || "Store"}  
                                    </p>
                                </Link>
                            </div>
                            {/* ... continue with rest of the original code ... */}
                            <div className="hidden lg:flex px-6 py-4 items-center justify-center">
                                <div className="flex items-center gap-2">
                                    <StarRating
                                      rating={data.reviewRating ?? 0}
                                      iconClassName="size-4"
                                    />
                                    <p className="text-base font-medium text-neutral-600">
                                        {data.reviewCount ?? 0} ratings
                                    </p>
                                </div>
                            </div>
                        </div>

                        {data.hasVariants && (
                            <div className="p-6 border-b space-y-6 bg-neutral-50/50">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">Product Options</h3>
                                    {(selectedColor || selectedSize) && (
                                        <button 
                                            onClick={() => { setSelectedColor(null); setSelectedSize(null); }}
                                            className="text-xs flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors font-semibold cursor-pointer"
                                        >
                                            <X size={14}/> Reset Selection
                                        </button>
                                    )}
                                </div>

                                {allPossibleColors.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold text-neutral-800">Color / Style</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {allPossibleColors.map((color) => {
                                                const isAvailable = availableColors.includes(color);
                                                const isSelected = selectedColor === color;
                                                return (
                                                    <button
                                                        key={color}
                                                        disabled={!isAvailable}
                                                        onClick={() => setSelectedColor(color === selectedColor ? null : color)}
                                                        className={cn(
                                                            "px-5 py-2.5 border rounded-lg font-medium transition-all duration-200 shadow-sm",
                                                            "cursor-pointer active:scale-95 touch-manipulation",
                                                            isSelected 
                                                                ? "bg-green-600 text-white border-green-700 ring-4 ring-green-500/10 scale-105" 
                                                                : "bg-white text-neutral-900 border-neutral-200 hover:border-green-500 hover:text-green-600",
                                                            !isAvailable && "opacity-25 cursor-not-allowed border-dashed grayscale"
                                                        )}
                                                    >
                                                        {color}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {allPossibleSizes.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold text-neutral-800">Size / Configuration</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {allPossibleSizes.map((size) => {
                                                const isAvailable = availableSizes.includes(size);
                                                const isSelected = selectedSize === size;
                                                return (
                                                    <button
                                                        key={size}
                                                        disabled={!isAvailable}
                                                        onClick={() => setSelectedSize(size === selectedSize ? null : size)}
                                                        className={cn(
                                                            "px-5 py-2.5 border rounded-lg font-medium transition-all duration-200 shadow-sm",
                                                            "cursor-pointer active:scale-95 touch-manipulation",
                                                            isSelected 
                                                                ? "bg-green-600 text-white border-green-700 ring-4 ring-green-500/10 scale-105" 
                                                                : "bg-white text-neutral-900 border-neutral-200 hover:border-green-500 hover:text-green-600",
                                                            !isAvailable && "opacity-25 cursor-not-allowed border-dashed grayscale"
                                                        )}
                                                    >
                                                        {size}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                                
                                {activeVariant && (
                                    <div className={cn(
                                        "p-4 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-1 duration-300",
                                        activeVariant.stock > 0 
                                            ? "bg-green-50 text-green-700 border border-green-200" 
                                            : "bg-red-50 text-red-700 border border-red-200"
                                    )}>
                                        {activeVariant.stock > 0 
                                            ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                                    ✓ {activeVariant.stock} available in stock
                                                </div>
                                            )
                                            : "✕ This variant is currently out of stock"}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="p-6">
                            {data.description ? (
                                <RichText data={data.description}/>
                            ): (
                                <p className="font-medium text-muted-foreground italic">No description provided</p>
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
                                        variantId={activeVariant?.id} 
                                        disabled={!!(data.hasVariants && (!activeVariant || activeVariant.stock === 0))}
                                      />
                                    <button
                                      className={cn(
                                        "size-12 flex items-center justify-center border rounded-md transition-all shadow-sm cursor-pointer",
                                        isCopied ? "bg-green-600 text-white border-green-700" : "bg-white hover:bg-neutral-50 active:scale-90"
                                      )}
                                      onClick={() => {
                                          setIsCopied(true);
                                          navigator.clipboard.writeText(window.location.href);
                                          toast.success("Link copied to clipboard!");
                                          setTimeout(() => setIsCopied(false), 2000);
                                      }}
                                    >
                                        {isCopied ? <CheckIcon className="size-5"/> : <LinkIcon className="size-5" />}
                                    </button>
                                </div>
                                <p className="text-center font-medium text-neutral-600 text-sm">
                                    {data.refundPolicy === "no-refunds" ? "Final Sale - No refunds" : `${data.refundPolicy?.replace('-',' ') ?? 'Standard'} return policy`}
                                </p>
                            </div>

                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-medium">Customer Reviews</h3>
                                    <div className="flex items-center gap-x-1 font-bold text-base">
                                        <StarIcon className="size-4 fill-green-500 text-green-500" />
                                        <p>{(data.reviewRating ?? 0).toFixed(1)}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-[auto_1fr_auto] gap-3 mt-6 items-center">
                                {[5, 4, 3, 2, 1].map((stars) => (
                                    <Fragment key={stars}>
                                        <div className="font-medium text-sm text-neutral-500">{stars}★</div>
                                        <Progress 
                                            value={data.ratingDistribution?.[stars] ?? 0} 
                                            className="h-2 bg-neutral-100" 
                                        />
                                        <div className="font-medium text-sm text-neutral-400 w-8 text-right">
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

// ... (ProductViewSkeleton remains the same)
export const ProductViewSkeleton = () => {
    return (
        <div className="px-4 lg:px-12 py-10">
            <div className="border rounded-sm bg-white overflow-hidden">
                <div className="relative w-full h-[300px] sm:h-[400px] md:h-[600px] lg:h-[700px] xl:h-[800px] bg-neutral-50 flex items-center justify-center border-b overflow-hidden">
                    <div className="relative size-40 md:size-64 opacity-20 animate-pulse">
                        <Image
                            src="/placeholder.png"
                            alt="Loading..."
                            fill
                            className="object-contain grayscale"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-6 p-6">
                    <div className="col-span-4 h-24 bg-neutral-100 animate-pulse rounded-md" />
                </div>
            </div>
        </div>
    );
};