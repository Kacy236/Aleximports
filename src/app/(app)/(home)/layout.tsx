import { Suspense } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getQueryClient, trpc } from "@/trpc/server";
import { Footer } from "@/modules/home/ui/components/footer";
import { Navbar } from "@/modules/home/ui/components/navbar";
import {
  SearchFilters,
  SearchFiltersSkeleton,
} from "@/modules/home/ui/components/search-filters";

interface Props {
  children: React.ReactNode;
}

export default async function Layout({ children }: Props) {
  const queryClient = getQueryClient();

  /**
   * ✅ THE FIX: Wrap prefetches in a try/catch.
   * During 'npm run build', the server isn't running, so fetch fails.
   * This allows the build to continue and fetches data on the client instead.
   */
  try {
    await Promise.allSettled([
      queryClient.prefetchQuery(trpc.categories.getMany.queryOptions()),
      queryClient.prefetchQuery(trpc.tenants.getMany.queryOptions()),
    ]);
  } catch (error) {
    console.warn("Build-time prefetch failed. This is expected if the server is offline during build.");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <HydrationBoundary state={dehydrate(queryClient)}>
        {/* Suspense ensures that even if prefetch fails, 
            the UI shows a skeleton while fetching on the client.
        */}
        <Suspense fallback={<SearchFiltersSkeleton />}>
          <SearchFilters />
        </Suspense>
      </HydrationBoundary>

      <div className="flex-1 bg-[#F4F4F0]">{children}</div>
      <Footer />
    </div>
  );
}