"use client";

import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { 
    LinkIcon, 
    StarIcon, 
    CheckIcon, 
    ChevronLeft, 
    ChevronRight, 
    X, 
    Maximize2, 
    AlertCircle, 
    ShieldCheck, 
    Truck, 
    RefreshCcw,
    ShoppingCart
} from "lucide-react";
import { formatCurrency, generateTenantURL, cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState, useMemo, useEffect, Fragment, useCallback, useRef } from "react";
import { RichText } from "@payloadcms/richtext-lexical/react";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Media, Tenant } from "@/payload-types";

/**
 * Dynamic import for CartButton to prevent hydration mismatch 
 * on stock-sensitive UI elements.
 */
const CartButton = dynamic(
    () => import("../components/cart-button").then((mod) => mod.CartButton),
    {
        ssr: false,
        loading: () => (
            <Button disabled className="flex-1 bg-green-500 h-12">
                <ShoppingCart size={20} />
                Loading Cart...
            </Button>
        )
    },
);

interface ProductViewProps {
    productId: string;
    tenantSlug: string;
}

export const ProductView = ({ productId, tenantSlug }: ProductViewProps) => {
    // --- COMPONENT STATE ---
    const [isMounted, setIsMounted] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);

    // --- REFS FOR SWIPE GESTURES ---
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);

    // Ensure client-side only rendering for sensitive parts
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // --- DATA FETCHING ---
    const trpc = useTRPC();
    const { data } = useSuspenseQuery(
        trpc.products.getOne.queryOptions({ id: productId })
    );

    const images = useMemo(() => data?.images || [], [data?.images]);

    // --- GALLERY NAVIGATION ---
    const nextImage = useCallback(() => {
        if (images.length <= 1) return;
        setSelectedImageIndex((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const prevImage = useCallback(() => {
        if (images.length <= 1) return;
        setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    // --- ADVANCED TOUCH HANDLERS ---
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        touchEndX.current = null;
        const firstTouch = e.targetTouches[0];
        if (firstTouch) {
            touchStartX.current = firstTouch.clientX;
        }
    };

    const onTouchMove = (e: React.TouchEvent) => {
        const moveTouch = e.targetTouches[0];
        if (moveTouch) {
            touchEndX.current = moveTouch.clientX;
        }
    };

    const onTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;
        
        const distance = touchStartX.current - touchEndX.current;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            nextImage();
        } else if (isRightSwipe) {
            prevImage();
        }
    };

    // --- WINDOW EVENTS (KEYBOARD & SCROLL) ---
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

    // --- VARIANT LOGIC ENGINE ---
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

    const currentPrice = useMemo(() => {
        if (activeVariant?.variantPrice) return activeVariant.variantPrice;
        return data?.price || 0;
    }, [activeVariant, data?.price]);

    const tenant = data?.tenant as (Tenant & { image?: Media }) | undefined;
    const tenantImage = tenant?.image;

    // --- OPTION CALCULATIONS ---
    const allPossibleColors = useMemo(() => {
        if (!data?.hasVariants || !data?.variants) return [];
        return Array.from(new Set(data.variants.map((v: any) => v.color).filter(Boolean))) as string[];
    }, [data?.variants, data?.hasVariants]);

    const allPossibleSizes = useMemo(() => {
        if (!data?.hasVariants || !data?.variants) return [];
        return Array.from(new Set(data.variants.map((v: any) => v.size).filter(Boolean))) as string[];
    }, [data?.variants, data?.hasVariants]);

    if (!isMounted) return <ProductViewSkeleton />;
    if (!data) return null;

    return (
        <div className="px-0 sm:px-4 lg:px-12 py-0 sm:py-10 min-h-screen bg-neutral-50/20">
            {/* --- LIGHTBOX OVERLAY --- */}
            {isLightboxOpen && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300 touch-none"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    <button 
                        className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2 z-[110] cursor-pointer"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <X size={44} />
                    </button>

                    {images.length > 1 && (
                        <div className="hidden md:block">
                            <button 
                                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                className="absolute left-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-4 z-[110] transition-all hover:scale-110 cursor-pointer"
                            >
                                <ChevronLeft size={60} strokeWidth={1} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                className="absolute right-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-4 z-[110] transition-all hover:scale-110 cursor-pointer"
                            >
                                <ChevronRight size={60} strokeWidth={1} />
                            </button>
                        </div>
                    )}
                    
                    <div className="relative w-full h-full max-w-7xl max-h-[85vh] mx-4 pointer-events-none select-none">
                        <Image
                            src={currentDisplayImage}
                            alt={data?.name || "Full screen view"}
                            fill
                            className="object-contain"
                            quality={100}
                        />
                    </div>
                </div>
            )}

            <div className="max-w-[1600px] mx-auto border-x-0 sm:border-2 border-black sm:rounded-sm bg-white overflow-hidden sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                {/* --- MAIN HERO GALLERY --- */}
                <div 
                    className="relative group w-full h-[400px] sm:h-[500px] md:h-[700px] lg:h-[850px] border-b-2 border-black bg-neutral-100 overflow-hidden"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    <div 
                        className="relative w-full h-full cursor-zoom-in"
                        onClick={() => setIsLightboxOpen(true)}
                    >
                        <Image
                            src={currentDisplayImage}
                            alt={data?.name || "Product Image"}
                            fill
                            className="object-contain transition-transform duration-700 group-hover:scale-105"
                            priority
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 pointer-events-none">
                            <div className="bg-black text-white p-4 rounded-full shadow-xl flex items-center gap-2 font-bold uppercase text-xs tracking-widest">
                                <Maximize2 size={18} /> View Larger
                            </div>
                        </div>
                    </div>

                    {images.length > 1 && (
                        <>
                            <button 
                                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                className="absolute left-6 top-1/2 -translate-y-1/2 z-10 p-4 rounded-full bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[52%] active:translate-x-1 active:translate-y-[-48%] transition-all cursor-pointer hidden md:flex"
                            >
                                <ChevronLeft className="size-8" />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                className="absolute right-6 top-1/2 -translate-y-1/2 z-10 p-4 rounded-full bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[52%] active:translate-x-[-4px] active:translate-y-[-48%] transition-all cursor-pointer hidden md:flex"
                            >
                                <ChevronRight className="size-8" />
                            </button>
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-2 rounded-full text-xs font-black tracking-tighter border-2 border-white">
                                {selectedImageIndex + 1} / {images.length}
                            </div>
                        </>
                    )}
                </div>

                {/* --- CONTENT GRID --- */}
                <div className="grid grid-cols-1 lg:grid-cols-6 divide-y-2 lg:divide-y-0 lg:divide-x-2 divide-black">
                    
                    {/* --- LEFT COLUMN: DETAILS & VARIANTS --- */}
                    <div className="col-span-4 flex flex-col">
                        <div className="p-6 sm:p-8 lg:p-12">
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-black uppercase tracking-widest text-green-600 bg-green-50 w-fit px-2 py-1 border border-green-600">New Arrival</span>
                                <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black uppercase italic tracking-tighter text-black leading-tight break-words">
                                    {data.name}
                                </h1>
                            </div>
                        </div>
                        
                        <div className="border-y-2 border-black grid grid-cols-2 md:grid-cols-4 bg-white divide-x-2 divide-y-2 md:divide-y-0 divide-black">
                            <div className="p-4 sm:p-6 flex flex-col items-center justify-center">
                                <span className="text-[10px] font-black uppercase text-neutral-400 mb-1">Price</span>
                                <p className="text-xl sm:text-2xl font-black text-black">
                                    {formatCurrency(Number(currentPrice))}
                                </p>
                            </div>

                            <div className="p-4 sm:p-6 flex flex-col items-center justify-center overflow-hidden">
                                <span className="text-[10px] font-black uppercase text-neutral-400 mb-1">Vendor</span>
                                <Link href={generateTenantURL(tenantSlug)} className="flex items-center gap-2 group cursor-pointer max-w-full">
                                    {tenantImage?.url && (
                                        <Image src={tenantImage.url} alt="store" width={20} height={20} className="rounded-full border border-black size-5 shrink-0" />
                                    )}
                                    <span className="font-bold border-b-2 border-black group-hover:bg-black group-hover:text-white transition-colors truncate block">
                                        {tenant?.name}
                                    </span>
                                </Link>
                            </div>

                            <div className="p-4 sm:p-6 flex flex-col items-center justify-center">
                                <span className="text-[10px] font-black uppercase text-neutral-400 mb-1">Rating</span>
                                <div className="flex items-center gap-1">
                                    <StarRating rating={data.reviewRating ?? 0} iconClassName="size-3" />
                                    <span className="font-bold text-xs">({data.reviewCount ?? 0})</span>
                                </div>
                            </div>

                            <div className="p-4 sm:p-6 flex flex-col items-center justify-center">
                                <span className="text-[10px] font-black uppercase text-neutral-400 mb-1">Shipping</span>
                                <span className="font-bold text-xs uppercase tracking-widest text-center">Free Global</span>
                            </div>
                        </div>

                        {/* --- VARIANT SELECTOR --- */}
                        {data.hasVariants && (
                            <div className="p-3 sm:p-8 lg:p-12 border-b-2 border-black space-y-6 bg-neutral-50/50">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black uppercase tracking-widest border-l-4 border-black pl-3">Color / Style</h3>
                                    {(selectedColor || selectedSize) && (
                                        <button onClick={() => { setSelectedColor(null); setSelectedSize(null); }} className="text-xs font-black flex items-center gap-1 text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors uppercase cursor-pointer">
                                            <RefreshCcw size={12} /> Reset
                                        </button>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-1">
                                    {allPossibleColors.map((color) => {
                                        const colorVar = data.variants?.find((v: any) => v.color === color);
                                        const vImg = (colorVar?.variantImage as Media)?.url;
                                        const stock = colorVar?.stock ?? 0;
                                        const isSelected = selectedColor === color;
                                        const isLow = stock > 0 && stock <= 10;

                                        return (
                                            <button
                                                key={color}
                                                onClick={() => setSelectedColor(color === selectedColor ? null : color)}
                                                className={cn(
                                                    "group flex flex-col items-center gap-2 p-2 border-2 transition-all duration-300 cursor-pointer",
                                                    isSelected 
                                                        ? "border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1" 
                                                        : "border-transparent hover:border-neutral-200"
                                                )}
                                            >
                                                <div className="relative size-20 sm:size-24 border-2 border-black overflow-hidden bg-white">
                                                    {vImg ? (
                                                        <Image src={vImg} alt={color} fill className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-neutral-200 flex items-center justify-center text-[10px] font-bold uppercase">No Preview</div>
                                                    )}
                                                    {isLow && (
                                                        <div className="absolute top-1 left-1 right-1 z-10">
                                                            <div className="bg-orange-500 text-white text-[8px] font-black uppercase py-1 rounded flex items-center justify-center gap-1 shadow-lg border border-black">
                                                                <AlertCircle size={8} /> {stock}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {stock === 0 && <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10"><span className="text-[8px] font-black uppercase bg-black text-white px-1">Sold Out</span></div>}
                                                </div>
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-tighter border-2 border-black px-2 py-0.5",
                                                    isSelected ? "bg-black text-white" : "bg-white text-black"
                                                )}>
                                                    {color}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="space-y-4 pt-4">
                                    <h3 className="text-sm font-black uppercase tracking-widest border-l-4 border-black pl-3">Size</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {allPossibleSizes.map((size) => {
                                            const isSelected = selectedSize === size;
                                            return (
                                                <button
                                                    key={size}
                                                    onClick={() => setSelectedSize(size === selectedSize ? null : size)}
                                                    className={cn(
                                                        "px-6 py-3 border-2 font-black text-sm uppercase transition-all cursor-pointer",
                                                        isSelected 
                                                            ? "bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(22,163,74,1)]" 
                                                            : "bg-white text-black border-black hover:bg-neutral-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
                                                    )}
                                                >
                                                    {size}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="p-6 sm:p-8 lg:p-12 prose prose-neutral max-w-none">
                            <h3 className="text-xl font-black uppercase tracking-tighter mb-6">Product Story</h3>
                            {data.description ? <RichText data={data.description} /> : <p className="italic">No description available.</p>}
                        </div>
                    </div>

                    {/* --- RIGHT COLUMN: ACTIONS & STATS --- */}
                    <div className="col-span-2 flex flex-col bg-neutral-50/30">
                        <div className="p-8 space-y-8 sticky top-0">
                            <div className="flex flex-col gap-4">
                                <CartButton 
                                    productId={productId} 
                                    tenantSlug={tenantSlug} 
                                    variantId={activeVariant?.id}
                                    disabled={!!(data.hasVariants && (!activeVariant || activeVariant.stock === 0))}
                                />
                                <button 
                                    onClick={() => {
                                        setIsCopied(true);
                                        navigator.clipboard.writeText(window.location.href);
                                        toast.success("Link copied!");
                                        setTimeout(() => setIsCopied(false), 2000);
                                    }}
                                    className={cn(
                                        "w-full h-14 border-2 border-black flex items-center justify-center gap-3 font-black uppercase text-sm transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 cursor-pointer",
                                        isCopied ? "bg-green-600 text-white border-green-700" : "bg-white hover:bg-neutral-50"
                                    )}
                                >
                                    {isCopied ? <CheckIcon size={20} /> : <LinkIcon size={20} />}
                                    {isCopied ? "Copied" : "Share Product"}
                                </button>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Customer Reviews</h4>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-4xl font-black italic tracking-tighter">{(data.reviewRating ?? 0).toFixed(1)}</span>
                                        <div className="flex flex-col">
                                            <StarRating rating={data.reviewRating ?? 0} />
                                            <span className="text-[10px] font-bold text-neutral-500 uppercase">{data.reviewCount} total reviews</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2 pt-2">
                                    {[5, 4, 3, 2, 1].map((stars) => (
                                        <div key={stars} className="flex items-center gap-3">
                                            <span className="text-xs font-black w-4">{stars}</span>
                                            <div className="flex-1 h-3 border-2 border-black bg-white overflow-hidden">
                                                <div 
                                                    className="h-full bg-green-500 border-r-2 border-black transition-all duration-1000" 
                                                    style={{ width: `${data.ratingDistribution?.[stars] ?? 0}%` }} 
                                                />
                                            </div>
                                            <span className="text-[10px] font-bold w-8 text-right">{data.ratingDistribution?.[stars] ?? 0}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 border-2 border-black bg-white space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                                <div className="flex items-start gap-4">
                                    <Truck size={20} className="shrink-0 mt-1" />
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-tight">Express Delivery</p>
                                        <p className="text-[10px] text-neutral-500 font-bold uppercase leading-tight">Ships within 24-48 hours from the warehouse.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <RefreshCcw size={20} className="shrink-0 mt-1" />
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-tight">Return Policy</p>
                                        <p className="text-[10px] text-neutral-500 font-bold uppercase leading-tight">
                                            {data.refundPolicy === "no-refunds" ? "All sales final. No returns." : "30-Day Money Back Guarantee."}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <ShieldCheck size={20} className="shrink-0 mt-1" />
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-tight">Authentic Product</p>
                                        <p className="text-[10px] text-neutral-500 font-bold uppercase leading-tight">Verified vendor and original item guarantee.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- COMPREHENSIVE SKELETON LOADER ---
export const ProductViewSkeleton = () => {
    return (
        <div className="px-0 sm:px-4 lg:px-12 py-0 sm:py-10 animate-pulse bg-neutral-50">
            <div className="max-w-[1600px] mx-auto border-y-2 sm:border-2 border-neutral-200 rounded-sm bg-white overflow-hidden">
                <div className="w-full h-[400px] sm:h-[600px] bg-neutral-200" />
                <div className="grid grid-cols-1 lg:grid-cols-6 divide-x-0 lg:divide-x-2 divide-neutral-100">
                    <div className="col-span-4 p-8 sm:p-12 space-y-8">
                        <div className="h-10 sm:h-16 w-3/4 bg-neutral-200 rounded-sm" />
                        <div className="h-20 w-full bg-neutral-100 rounded-sm" />
                        <div className="space-y-4">
                            <div className="h-6 w-1/4 bg-neutral-200 rounded-sm" />
                            <div className="flex gap-4">
                                <div className="size-20 sm:size-24 bg-neutral-200 rounded-sm" />
                                <div className="size-20 sm:size-24 bg-neutral-200 rounded-sm" />
                                <div className="size-20 sm:size-24 bg-neutral-200 rounded-sm" />
                            </div>
                        </div>
                    </div>
                    <div className="col-span-2 p-8 bg-neutral-50/50 space-y-6 hidden lg:block">
                        <div className="h-14 w-full bg-neutral-200 rounded-sm" />
                        <div className="h-14 w-full bg-neutral-200 rounded-sm" />
                        <div className="h-40 w-full bg-neutral-100 rounded-sm" />
                    </div>
                </div>
            </div>
        </div>
    );
};