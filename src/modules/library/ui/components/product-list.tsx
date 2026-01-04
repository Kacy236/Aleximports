"use client";

import { Button } from "@/components/ui/button";
import { DEFAULT_LIMIT } from "@/constants";
import { useTRPC } from "@/trpc/client";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { ProductCard, ProductCardSkeleton } from "./product-card";
import { InboxIcon } from "lucide-react";
import { Media, Product, Tenant } from "@/payload-types";

// Define a local type for our product with populated fields
type PopulatedProduct = Product & {
  tenant: Tenant & { image: Media | null };
};

export const ProductList = () => {
  const trpc = useTRPC();
  
  const { 
    data, 
    hasNextPage, 
    isFetchingNextPage, 
    fetchNextPage 
  } = useSuspenseInfiniteQuery(
    (trpc.library.getMany.infiniteQueryOptions as any)(
      {
        limit: DEFAULT_LIMIT,
        cursor: 1 as number | null,
      },
      {
        initialPageParam: 1 as number | null,
        getNextPageParam: (lastPage: any) => lastPage.nextPage ?? null,
      }
    )
  ) as any; // ✅ Casting the result to 'any' allows us to access .pages

  // Since we used 'as any', we can now safely access the deeply nested properties
  const pages = data?.pages || [];
  const firstPageDocs = pages[0]?.docs || [];

  if (firstPageDocs.length === 0) {
    return (
      <div className="border border-black border-dashed flex items-center justify-center p-8 flex-col gap-y-4 bg-white w-full rounded-lg">
        <InboxIcon />
        <p className="text-base font-medium">No Products found</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {pages.flatMap((page: any) => page.docs || []).map((product: any) => {
          // Handle the multi-image structure
          const firstImageRow = product.images?.[0];
          const imageObject = firstImageRow?.image as Media | undefined;
          const imageUrl = imageObject?.url;

          return (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              imageUrl={imageUrl}
              tenantSlug={product.tenant?.slug}
              tenantImageUrl={product.tenant?.image?.url}
              reviewRating={product.reviewRating}
              reviewCount={product.reviewCount}
            />
          );
        })}
      </div>
      <div className="flex justify-center pt-8">
        {hasNextPage && (
          <Button
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
            className="font-medium disabled:opacity-50 text-base bg-white"
            variant="elevated"
          >
            {isFetchingNextPage ? "Loading..." : "Load more"}
          </Button>
        )}
      </div>
    </>
  );
};

export const ProductListSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
      {Array.from({ length: DEFAULT_LIMIT }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};