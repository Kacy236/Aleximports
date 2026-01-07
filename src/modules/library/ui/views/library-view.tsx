"use client";

import Link from "next/link";
import { ArrowLeftIcon, BookmarkIcon, ShoppingBagIcon } from "lucide-react";
import { ProductList, ProductListSkeleton } from "../components/product-list";
import { Suspense } from "react";
import { cn } from "@/lib/utils";

export const LibraryView = () => {
    return (
        <div className="min-h-screen bg-white">
            {/* NAVIGATION */}
            <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-neutral-100">
                <div className="max-w-(--breakpoint-xl) mx-auto px-4 lg:px-12 h-16 flex items-center">
                    <Link 
                        prefetch 
                        href="/" 
                        className="group flex items-center gap-2 text-neutral-600 hover:text-green-600 transition-colors cursor-pointer"
                    >
                        <div className="p-1 rounded-full group-hover:bg-green-50 transition-colors">
                            <ArrowLeftIcon className="size-4 transition-transform group-hover:-translate-x-0.5" />
                        </div>
                        <span className="text-sm font-semibold tracking-tight">Continue shopping</span>
                    </Link>
                </div>
            </nav>

            {/* HEADER SECTION */}
            <header className="relative overflow-hidden bg-[#F4F4F0] border-b border-neutral-200">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 opacity-5 pointer-events-none">
                    <BookmarkIcon size={400} />
                </div>

                <div className="max-w-(--breakpoint-xl) mx-auto px-4 lg:px-12 py-16 relative z-10">
                    <div className="flex flex-col gap-y-3">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-600 p-2 rounded-lg shadow-sm">
                                <ShoppingBagIcon className="size-6 text-white" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-green-700">Account Resources</span>
                        </div>
                        
                        <h1 className="text-5xl lg:text-6xl font-medium tracking-tight text-neutral-900">
                            Your <span className="text-green-600">Library</span>
                        </h1>
                        
                        <p className="text-lg font-medium text-neutral-600 max-w-md leading-relaxed">
                            Access all your digital purchases, track physical orders, and manage your product reviews in one place.
                        </p>
                    </div>
                </div>
            </header>

            {/* CONTENT SECTION */}
            <main className="max-w-(--breakpoint-xl) mx-auto px-4 lg:px-12 py-12">
                <div className="flex items-center justify-between mb-8 border-b border-neutral-100 pb-4">
                    <h2 className="text-xl font-bold text-neutral-800">Purchased Products</h2>
                    <div className="text-sm text-neutral-400 font-medium">
                        Showing all items
                    </div>
                </div>

                <section className="min-h-[400px]">
                    <Suspense fallback={<ProductListSkeleton />}>
                        <ProductList />
                    </Suspense>
                </section>
            </main>

            {/* FOOTER TIP (Optional) */}
            <footer className="max-w-(--breakpoint-xl) mx-auto px-4 lg:px-12 py-10 border-t border-neutral-50">
                <div className="bg-neutral-50 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-neutral-500 font-medium text-center md:text-left">
                        Missing a purchase? Contact our support team with your order ID.
                    </p>
                    <button className="text-sm font-bold text-green-600 hover:text-green-700 underline underline-offset-4 cursor-pointer">
                        Get Help
                    </button>
                </div>
            </footer>
        </div>
    );
};