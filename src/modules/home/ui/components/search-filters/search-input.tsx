"use client";

import { SearchIcon, ListFilterIcon, BookmarkCheckIcon, StoreIcon } from "lucide-react" 
import { Input } from "@/components/ui/input"
import { CategoriesSidebar } from "./categories-sidebar"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useTRPC } from "@/trpc/client"
import { useQuery } from "@tanstack/react-query";
import Link from "next/link"; // Cleaned up import
import { cn } from "@/lib/utils";

interface Props {
    disabled?: boolean;
    defaultValue?: string | undefined;
    tenantValue?: string | undefined; // Added for tenant
    placeholder?: string;
    onChange?: (value: string) => void; 
    onTenantChange?: (value: string) => void; // Added for tenant
};

export const SearchInput = ({
    disabled,
    defaultValue,
    tenantValue,
    placeholder = "Search...",
    onChange,
    onTenantChange,
}: Props) => {
    const [searchValue, setSearchValue] = useState(defaultValue || "");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const trpc = useTRPC()
    const session = useQuery(trpc.auth.session.queryOptions());
    
    // Fetch tenants to populate a quick-select or search
    const { data: tenants } = useQuery(trpc.tenants.getMany.queryOptions());

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            onChange?.(searchValue)
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchValue, onChange]);

    return (
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
            <CategoriesSidebar open={isSidebarOpen} onOpenChange={setIsSidebarOpen}/>
            
            <div className="flex items-center gap-2 w-full">
                {/* Product Search Input */}
                <div className="relative w-full">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
                    <Input
                        className="pl-8 h-12" 
                        placeholder={placeholder} 
                        disabled={disabled}
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                    />
                </div>

                <Button
                    variant="elevated"
                    className="size-12 shrink-0 flex lg:hidden"
                    onClick={() => setIsSidebarOpen(true)}
                >
                    <ListFilterIcon />
                </Button>
            </div>

            {session.data?.user && (
                <Button
                    asChild
                    variant="elevated"
                    className="h-12 px-4 shrink-0"
                >
                    <Link prefetch href="/library">
                        <BookmarkCheckIcon className="mr-2 size-4" />
                        Library
                    </Link>
                </Button>
            )}
        </div>
    )
}