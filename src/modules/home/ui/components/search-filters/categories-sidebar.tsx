"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { CategoriesGetManyOutput } from "@/modules/categories/types";

import { useSidebar } from "@/providers/SidebarProvider";

export const CategoriesSidebar = () => {
    const { open, setOpen } = useSidebar();

    const trpc = useTRPC();
    const { data } = useQuery(trpc.categories.getMany.queryOptions());

    const router = useRouter();

    const [parentCategories, setParentCategories] =
        useState<CategoriesGetManyOutput | null>(null);
    const [selectedCategory, setSelectedCategory] =
        useState<CategoriesGetManyOutput[1] | null>(null);

    const currentCategories = parentCategories ?? data ?? [];

    const handleOpenChange = (openState: boolean) => {
        setSelectedCategory(null);
        setParentCategories(null);
        setOpen(openState);
    };

    const handleCategoryClick = (category: CategoriesGetManyOutput[1]) => {
        const hasSubcategories =
            category.subcategories && category.subcategories.length > 0;

        // If this category has subcategories, show next list
        if (hasSubcategories) {
            setParentCategories(category.subcategories as CategoriesGetManyOutput);
            setSelectedCategory(category);
            return;
        }

        // If we're inside subcategories
        if (parentCategories && selectedCategory) {
            router.push(`/category/${selectedCategory.slug}/${category.slug}`);
        } else {
            if (category.slug === "all") router.push("/");
            else router.push(`/category/${category.slug}`);
        }

        handleOpenChange(false);
    };

    const handleBackClick = () => {
        setParentCategories(null);
        setSelectedCategory(null);
    };

    const backgroundColor = selectedCategory?.color || "white";

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
                    {parentCategories && (
                        <button
                            onClick={handleBackClick}
                            className="w-full text-left p-4 hover:bg-black hover:text-white flex items-center text-base font-medium"
                        >
                            <ChevronLeftIcon className="mr-2 size-4" />
                            Back
                        </button>
                    )}

                    {currentCategories.map((category) => (
                        <button
                            key={category.slug}
                            onClick={() => handleCategoryClick(category)}
                            className="w-full text-left p-4 hover:bg-black hover:text-white flex justify-between items-center text-base font-medium"
                        >
                            {category.name}
                            {category.subcategories?.length > 0 && (
                                <ChevronRightIcon className="size-4" />
                            )}
                        </button>
                    ))}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};
