"use client";

import { Button } from "@/components/ui/button";
import { DEFAULT_LIMIT } from "@/constants";
import { useTRPC } from "@/trpc/client";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { ProductCard, ProductCardSkeleton } from "./product-card";
import { InboxIcon } from "lucide-react";
import { Media } from "@/payload-types";
import { useProductFilters } from "@/modules/products/hooks/use-product-filters"; 
import { cn } from "@/lib/utils";

export const ProductList = () => {
  const [filters] = useProductFilters();
  const trpc = useTRPC();
  
  const { 
    data, 
    hasNextPage, 
    isFetchingNextPage, 
    fetchNextPage 
  } = useSuspenseInfiniteQuery(
    (trpc.library.getMany.infiniteQueryOptions as any)(
      {
        ...filters,
        limit: DEFAULT_LIMIT,
        cursor: 1 as number | null,
      },
      {
        initialPageParam: 1 as number | null,
        getNextPageParam: (lastPage: any) => lastPage.nextPage ?? null,
      }
    )
  ) as any;

  const pages = data?.pages || [];
  const firstPageDocs = pages[0]?.docs || [];

  if (firstPageDocs.length === 0) {
    return (
      <div className="border border-black border-dashed flex items-center justify-center p-12 flex-col gap-y-4 bg-white w-full rounded-lg text-center">
        <InboxIcon className="size-10 text-neutral-400" />
        <div>
          <p className="text-lg font-medium">No Products found</p>
          <p className="text-sm text-muted-foreground">You haven't purchased any items matching this search yet.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ✅ SIZE MATCH: 
          Uses 'grid-cols-2' for mobile and scales up to 'xl:grid-cols-5' 
          with the tighter 'gap-3' spacing from your storefront.
      */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {pages.flatMap((page: any) => page.docs || []).map((product: any) => {
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: DEFAULT_LIMIT }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};