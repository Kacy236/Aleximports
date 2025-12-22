import { Suspense } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getQueryClient, trpc } from "@/trpc/server";
import { Footer } from "@/modules/home/ui/components/footer";
import { Navbar } from "@/modules/home/ui/components/navbar";
import { PurchaseListener } from "@/components/PurchaseListener"; // 🚀 Import the listener
import {
  SearchFilters,
  SearchFiltersSkeleton,
} from "@/modules/home/ui/components/search-filters";

interface Props {
  children: React.ReactNode;
  params: { tenantSlug: string }; // 👈 Add params to get the slug
}

export default async function Layout({ children, params }: Props) {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(
    trpc.categories.getMany.queryOptions(),
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* 🚀 The PurchaseListener sits here. 
          Because it's in the layout, it will catch the Paystack 
          redirect even if the user lands on a specific category 
          or the home page.
      */}
      <Suspense fallback={null}>
        <PurchaseListener tenantSlug={params.tenantSlug} />
      </Suspense>

      <Navbar />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<SearchFiltersSkeleton />}>
          <SearchFilters />
        </Suspense>
      </HydrationBoundary>

      <div className="flex-1 bg-[#F4F4F0]">{children}</div>
      <Footer />
    </div>
  );
}