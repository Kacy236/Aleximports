"use client";

import Link from "next/link";
import { ArrowLeftIcon, InfoIcon } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { ReviewSidebar } from "../components/review-sidebar";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { Suspense } from "react";
import { ReviewFormSkeleton } from "../components/review-form";
import { cn } from "@/lib/utils";

interface Props {
    productId: string;
}

export const ProductView = ({ productId }: Props) => {
    const trpc = useTRPC();
    
    // We fetch the library item which should include purchase details
    const { data } = useSuspenseQuery(trpc.library.getOne.queryOptions({
        productId,
    }));

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="p-4 bg-[#F4F4F0] w-full border-b">
                <div className="max-w-(--breakpoint-xl) mx-auto px-4 lg:px-12">
                    <Link prefetch href="/library" className="flex items-center gap-2 group w-fit">
                        <ArrowLeftIcon className="size-4 group-hover:-translate-x-1 transition-transform"/>
                        <span className="text font-medium">Back to Library</span>
                    </Link>
                </div>
            </nav>

            {/* Header */}
            <header className="bg-[#F4F4F0] py-12 border-b">
                <div className="max-w-(--breakpoint-xl) mx-auto px-4 lg:px-12">
                    <div className="space-y-2">
                        <h1 className="text-[40px] leading-tight font-medium text-neutral-900">
                            {data.name}
                        </h1>
                        
                        {/* Display the specific option purchased. 
                          This helps users identify which 'Variant' this content belongs to.
                        */}
                        {data.purchasedVariant && (
                            <div className="flex items-center gap-2 text-neutral-500 font-medium">
                                <span className="text-sm px-2 py-0.5 bg-neutral-200 rounded text-neutral-700">
                                    Purchased: {data.purchasedVariant}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <section className="max-w-(--breakpoint-xl) mx-auto px-4 lg:px-12 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-7 gap-8 lg:gap-16">
                    
                    {/* Left Column: Sidebar Actions/Reviews */}
                    <div className="lg:col-span-2 order-2 lg:order-1">
                        <div className="sticky top-6 space-y-4">
                            <div className="p-6 bg-white rounded-md border shadow-sm border-neutral-200">
                                <h3 className="font-bold mb-4 flex items-center gap-2">
                                    <InfoIcon className="size-4" />
                                    Your Review
                                </h3>
                                <Suspense fallback={<ReviewFormSkeleton />}>
                                    <ReviewSidebar productId={productId} />
                                </Suspense>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Main Content */}
                    <div className="lg:col-span-5 order-1 lg:order-2">
                        <div className="prose prose-neutral max-w-none">
                            {data.content ? (
                                <RichText data={data.content} />
                            ) : (
                                <div className="p-12 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center">
                                    <p className="font-medium italic text-muted-foreground">
                                        This product doesn't have any additional library content yet.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export const ProductViewSkeleton = () => {
    return (
        <div className="min-h-screen bg-white">
            <nav className="p-4 bg-[#F4F4F0] w-full border-b">
                <div className="max-w-(--breakpoint-xl) mx-auto px-4 lg:px-12">
                    <div className="flex items-center gap-2 animate-pulse">
                        <div className="size-4 bg-neutral-200 rounded" />
                        <div className="h-4 w-24 bg-neutral-200 rounded" />
                    </div>
                </div>
            </nav>
            <header className="bg-[#F4F4F0] py-12 border-b animate-pulse">
                <div className="max-w-(--breakpoint-xl) mx-auto px-4 lg:px-12">
                    <div className="h-12 w-2/3 bg-neutral-200 rounded" />
                </div>
            </header>
        </div>
    );
};