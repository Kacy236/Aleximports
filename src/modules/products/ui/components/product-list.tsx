"use client";

import { Button } from "@/components/ui/button";
import { DEFAULT_LIMIT } from "@/constants";
import { useTRPC } from "@/trpc/client";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";

import { useProductFilters } from "../../hooks/use-product-filters";
import { ProductCard, ProductCardSkeleton } from "./product-card";
import { InboxIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Media } from "@/payload-types";

interface Props {
  category?: string;
  tenantSlug?: string;
  narrowView?: boolean;
}

export const ProductList = ({ category, tenantSlug: propTenantSlug, narrowView }: Props) => {
  const [filters] = useProductFilters();
  const trpc = useTRPC();

  /**
   * RESOLVE TENANT SLUG:
   * 1. If 'propTenantSlug' exists, the component is likely locked to a specific store page.
   * 2. Otherwise, we use 'filters.tenantSlug' which comes from your SearchInput dropdown/URL.
   */
  const activeTenantSlug = propTenantSlug || filters.tenantSlug;

  const { 
      data, 
      hasNextPage, 
      isFetchingNextPage, 
      fetchNextPage 
    } = useSuspenseInfiniteQuery(trpc.products.getMany.infiniteQueryOptions(
      {
          ...filters,
          category,
          tenantSlug: activeTenantSlug,
          limit: DEFAULT_LIMIT,
      },
      {
          getNextPageParam: (lastPage) => {
              return lastPage.nextPage ?? undefined;
          },
      }
  ));

  // Access the first page to check if we have results
  if (data.pages?.[0]?.docs.length === 0) {
      return (
          <div className="border border-black border-dashed flex items-center justify-center p-12 flex-col gap-y-4 bg-white w-full rounded-lg">
              <InboxIcon className="size-10 text-neutral-400" />
              <div className="text-center">
                <p className="text-lg font-medium">No Products found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search or store filters.</p>
              </div>
          </div>
      )
  }

  return (
      <>
      <div
        className={cn(
          "grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
          narrowView && "lg:grid-cols-2 xl:grid-cols-3"
        )}>
          {data?.pages.flatMap((page) => page.docs).map((product) => {
              // Extract the first image from the Payload CMS array structure
              const firstImageRow = product.images?.[0];
              const imageObject = firstImageRow?.image as Media | undefined;
              const imageUrl = imageObject?.url;

              return (
                  <ProductCard 
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    imageUrl={imageUrl} 
                    tenantSlug={product.tenant?.slug || ""}
                    tenantImageUrl={product.tenant?.image?.url}
                    reviewRating={product.reviewRating}
                    reviewCount={product.reviewCount}
                    price={product.price}
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

export const ProductListSkeleton = ({ narrowView }: Props) => {
  return (
      <div
        className={cn(
          "grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
          narrowView && "lg:grid-cols-2 xl:grid-cols-3"
        )}>
          {Array.from({ length: DEFAULT_LIMIT }).map((_, index) => (
              <ProductCardSkeleton key={index} />
          ))}
      </div>
  );
};