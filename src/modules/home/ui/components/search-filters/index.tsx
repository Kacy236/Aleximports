"use client";

import { useTRPC } from "@/trpc/client";
import { Category } from "./category";
import { SearchInput } from "./search-input";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { DEFAULT_BG_COLOR } from "../../../constants";
import { BreadcrumbNavigation } from "./breadcrumbs-navigation";
import { useProductFilters } from "@/modules/products/hooks/use-product-filters";
import { StoreIcon } from "lucide-react"; // Import a store icon

export const SearchFilters = () => {
    const trpc = useTRPC();
    
    // Fetch Categories and Tenants (Assuming you have a getMany for tenants)
    const { data: categories } = useSuspenseQuery(trpc.categories.getMany.queryOptions());
    const { data: tenants } = useSuspenseQuery(trpc.tenants.getMany.queryOptions());

    const [filters, setFilters] = useProductFilters();

    const params = useParams();
    const categoryParam = params.category as string | undefined;
    const activeCategory = categoryParam || "all";

    const activeCategoryData = categories.find((category) => category.slug === activeCategory);
    const activeCategoryColor = activeCategoryData?.color || DEFAULT_BG_COLOR;
    const activeCategoryName = activeCategoryData?.name || null;

    const activeSubcategory = params.subcategory as string | undefined;
    const activeSubcategoryName =
        activeCategoryData?.subcategories?.find(
            (subcategory) => subcategory.slug === activeSubcategory
        )?.name || null;

    return (
        <div 
            className="px-4 lg:px-12 py-8 border-b flex flex-col gap-4 w-full transition-colors duration-500" 
            style={{ backgroundColor: activeCategoryColor }}
        >
            <div className="flex flex-col md:flex-row gap-3">
                {/* Product Search */}
                <div className="flex-[2]">
                    <SearchInput 
                        placeholder="Search products..."
                        defaultValue={filters.search} 
                        onChange={(value) => setFilters({ search: value })}
                    />
                </div>

                {/* Tenant/Store Search */}
                
            </div>

            <div className="hidden lg:block">
                <Category data={categories} />
            </div>

            <BreadcrumbNavigation
                activeCategoryName={activeCategoryName}
                activeCategory={activeCategory}
                activeSubcategoryName={activeSubcategoryName}
            />
        </div>
    );
};

export const SearchFiltersSkeleton = () => {
    return (
        <div className="px-4 lg:px-12 py-8 border-b flex flex-col gap-4 w-full bg-neutral-50">
            <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-[2] h-11 bg-neutral-200 animate-pulse rounded-md" />
                <div className="flex-1 h-11 bg-neutral-200 animate-pulse rounded-md" />
            </div>
            <div className="hidden lg:block">
                <div className="h-11 bg-neutral-100 rounded-md" />
            </div>
        </div>
    )
}