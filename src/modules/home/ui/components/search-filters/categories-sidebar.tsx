import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
// import { useRouter } from "next/navigation"; // ❌ No longer needed for navigation
import Link from "next/link"; // ✅ Import Link
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { CategoriesGetManyOutput } from "@/modules/categories/types";
import { cn } from "@/lib/utils"; // Assuming you have a cn utility, or use template literals

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const CategoriesSidebar = ({
    open,
    onOpenChange,
}: Props) => {
    const trpc = useTRPC();
    const { data } = useQuery(trpc.categories.getMany.queryOptions());

    // const router = useRouter(); // Removed

    const [parentCategories, setParentCategories] = useState<CategoriesGetManyOutput | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<CategoriesGetManyOutput[1] | null>(null);

    // If we have parent categories, show those, otherwise show root categories
    const currentCategories = parentCategories ?? data ?? [];

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setSelectedCategory(null);
            setParentCategories(null);
        }
        onOpenChange(open);
    };

    // Helper to determine the URL for a category
    const getCategoryUrl = (category: CategoriesGetManyOutput[1]) => {
        if (parentCategories && selectedCategory) {
            return `/${selectedCategory.slug}/${category.slug}`;
        }
        if (category.slug === "all") return "/";
        return `/${category.slug}`;
    };

    const handleDrillDown = (category: CategoriesGetManyOutput[1]) => {
        setParentCategories(category.subcategories as CategoriesGetManyOutput);
        setSelectedCategory(category);
    };

    const handleBackClick = () => {
        if (parentCategories) {
            setParentCategories(null);
            setSelectedCategory(null);
        }
    };

    const backgroundColor = selectedCategory?.color || "white";
    
    // Shared styles for consistency between Button and Link
    const itemStyles = "w-full text-left p-4 hover:bg-black hover:text-white flex justify-between items-center text-base font-medium cursor-pointer transition-colors";

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetContent
                side="left"
                className="p-0 transition-none"
                style={{ backgroundColor }}
            >
                <SheetHeader className="p-4 border-b">
                    <SheetTitle>Categories</SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex flex-col overflow-y-auto h-full pb-2">
                    {/* BACK BUTTON */}
                    {parentCategories && (
                        <button
                            type="button"
                            onClick={handleBackClick}
                            className={cn(itemStyles, "flex items-center")}
                        >
                            <ChevronLeftIcon className="size-4 mr-2" />
                            Back
                        </button>
                    )}

                    {/* CATEGORY LIST */}
                    {currentCategories.map((category) => {
                        const hasSubcategories = category.subcategories && category.subcategories.length > 0;

                        // CASE 1: Has Subcategories -> Render BUTTON (Drill Down)
                        if (hasSubcategories) {
                            return (
                                <button
                                    key={category.slug}
                                    type="button"
                                    onClick={() => handleDrillDown(category)}
                                    className={itemStyles}
                                >
                                    {category.name}
                                    <ChevronRightIcon className="size-4" />
                                </button>
                            );
                        }

                        // CASE 2: No Subcategories -> Render LINK (Navigate)
                        return (
                            <Link
                                key={category.slug}
                                href={getCategoryUrl(category)}
                                onClick={() => handleOpenChange(false)} // Simply close on click
                                className={itemStyles}
                            >
                                {category.name}
                                {/* No Icon for leaf nodes */}
                            </Link>
                        );
                    })}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};