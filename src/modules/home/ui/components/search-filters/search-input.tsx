"use client";

import { SearchIcon, ListFilterIcon, BookmarkCheckIcon, StoreIcon } from "lucide-react" 
import { Input } from "@/components/ui/input"
import { CategoriesSidebar } from "./categories-sidebar"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useTRPC } from "@/trpc/client"
import { useQuery } from "@tanstack/react-query";
import Link from "next/link"; 
import { cn } from "@/lib/utils";

interface Props {
    disabled?: boolean;
    defaultValue?: string | undefined;
    tenantValue?: string | undefined; 
    placeholder?: string;
    onChange?: (value: string) => void; 
    onTenantChange?: (value: string) => void; 
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
    const { data: tenants } = useQuery(trpc.tenants.getMany.queryOptions());

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            onChange?.(searchValue)
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchValue, onChange]);

    return (
        <div className="flex flex-col gap-2 w-full">
            <CategoriesSidebar open={isSidebarOpen} onOpenChange={setIsSidebarOpen}/>
            
            {/* Top Row: Search Input + Sidebar Toggle */}
            <div className="flex items-center gap-2 w-full">
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

                {/* Categories Sidebar Toggle (Mobile only) */}
                <Button
                    variant="elevated"
                    className="size-12 shrink-0 flex md:hidden"
                    onClick={() => setIsSidebarOpen(true)}
                >
                    <ListFilterIcon />
                </Button>

                {/* Desktop Store Selector (Visible only on md+) */}
                <div className="relative min-w-[160px] hidden md:block">
                    <StoreIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500 pointer-events-none" />
                    <select
                        disabled={disabled}
                        value={tenantValue || ""}
                        onChange={(e) => onTenantChange?.(e.target.value)}
                        className={cn(
                            "w-full h-12 pl-9 pr-4 text-sm bg-white border border-input rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-green-500",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <option value="">All Stores</option>
                        {tenants?.map((t) => (
                            <option key={t.id} value={t.slug}>{t.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Bottom Row (Mobile) / Library Row (Desktop) */}
            <div className="flex items-center gap-2 w-full">
                {/* Mobile Store Selector (Visible only below md) */}
                <div className="relative flex-1 md:hidden">
                    <StoreIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500 pointer-events-none" />
                    <select
                        disabled={disabled}
                        value={tenantValue || ""}
                        onChange={(e) => onTenantChange?.(e.target.value)}
                        className={cn(
                            "w-full h-12 pl-9 pr-4 text-sm bg-white border border-input rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-green-500",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <option value="">All Stores</option>
                        {tenants?.map((t) => (
                            <option key={t.id} value={t.slug}>{t.name}</option>
                        ))}
                    </select>
                </div>

                {/* Library Button */}
                {session.data?.user && (
                    <Button
                        asChild
                        variant="elevated"
                        className="h-12 px-4 flex-1 md:flex-none md:min-w-[120px]"
                    >
                        <Link prefetch href="/library">
                            <BookmarkCheckIcon className="mr-2 size-4" />
                            Library
                        </Link>
                    </Button>
                )}
            </div>
        </div>
    )
}