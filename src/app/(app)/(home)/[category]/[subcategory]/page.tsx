import type { SearchParams } from "nuqs/server";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { loadProductFilters } from "@/modules/products/search-params";
import { ProductListView } from "@/modules/products/ui/views/product-list-view";
import { DEFAULT_LIMIT } from "@/constants";

interface Props {
    params: Promise<{
        category: string;
        subcategory: string;
    }>;
    searchParams: Promise<SearchParams>;
}

export const dynamic = "force-dynamic";

const Page = async ({ params, searchParams }: Props) => {
    const { category, subcategory } = await params;
    const filters = await loadProductFilters(searchParams);

    const queryClient = getQueryClient();

    await queryClient.prefetchInfiniteQuery(
        trpc.products.getMany.infiniteQueryOptions({
            ...filters,
            category,           // <-- parent category
            subcategory,        // <-- child slug
            limit: DEFAULT_LIMIT,
        })
    );

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <ProductListView
                category={category}
                subcategory={subcategory}
            />
        </HydrationBoundary>
    );
};

export default Page;
