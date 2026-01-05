"use client";

import { 
    SearchIcon, 
    ListFilterIcon, 
    BookmarkCheckIcon, 
    StoreIcon, 
    Check, 
    ChevronDown 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { CategoriesSidebar } from "./categories-sidebar";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";

interface Props {
    disabled?: boolean;
    defaultValue?: string;
    tenantValue?: string;
    placeholder?: string;
    onChange?: (value: string) => void;
    onTenantChange?: (value: string) => void;
}

export const SearchInput = ({
    disabled,
    defaultValue,
    tenantValue,
    placeholder = "Search items...",
    onChange,
    onTenantChange,
}: Props) => {
    const [searchValue, setSearchValue] = useState(defaultValue || "");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isStoreOpen, setIsStoreOpen] = useState(false);

    const trpc = useTRPC();
    const session = useQuery(trpc.auth.session.queryOptions());
    const { data: tenants } = useQuery(trpc.tenants.getMany.queryOptions());

    const selectedStore = tenants?.find((t) => t.slug === tenantValue);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            onChange?.(searchValue);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchValue, onChange]);

    // Reusable bold border class
    const boldBorder = "border-2 border-neutral-900 focus-visible:ring-offset-0";

    return (
        <div className="w-full max-w-6xl mx-auto">
            <CategoriesSidebar open={isSidebarOpen} onOpenChange={setIsSidebarOpen} />

            {/* Main Container: 
                - Mobile: flex-col (stacked)
                - Desktop (md): flex-row (single line)
            */}
            <div className="flex flex-col md:flex-row items-center gap-3 w-full">
                
                {/* Search Bar Group */}
                <div className="relative flex-1 w-full group">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400 group-focus-within:text-green-600 transition-colors" />
                    <Input
                        className={cn(
                            "pl-9 h-12 bg-white rounded-xl shadow-sm transition-all focus-visible:ring-green-500",
                            boldBorder
                        )}
                        placeholder={placeholder}
                        disabled={disabled}
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                    />
                </div>

                {/* Mobile Category Toggle (hidden on Desktop) */}
                <Button
                    variant="outline"
                    className={cn(
                        "size-12 shrink-0 md:hidden rounded-xl hover:bg-green-50 hover:text-green-600",
                        boldBorder
                    )}
                    onClick={() => setIsSidebarOpen(true)}
                >
                    <ListFilterIcon className="size-5" />
                </Button>

                {/* Desktop/Mobile Wrappers: On desktop these join the line above */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Store Selector */}
                    <Popover open={isStoreOpen} onOpenChange={setIsStoreOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isStoreOpen}
                                className={cn(
                                    "h-12 flex-1 md:flex-none md:min-w-[180px] justify-between rounded-xl bg-white px-4 font-semibold hover:bg-green-50/50",
                                    boldBorder,
                                    tenantValue && "border-green-600 bg-green-50/30 text-green-700"
                                )}
                                disabled={disabled}
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <StoreIcon className={cn("size-4 text-neutral-400", tenantValue && "text-green-600")} />
                                    {selectedStore ? selectedStore.name : "All Stores"}
                                </div>
                                <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-0 rounded-xl shadow-xl border-2 border-neutral-900" align="end">
                            <Command className="rounded-xl">
                                <CommandInput placeholder="Search stores..." className="h-10" />
                                <CommandList>
                                    <CommandEmpty>No store found.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem
                                            onSelect={() => {
                                                onTenantChange?.("");
                                                setIsStoreOpen(false);
                                            }}
                                            className="py-3 cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <span>All Stores</span>
                                                {!tenantValue && <Check className="size-4 text-green-600" />}
                                            </div>
                                        </CommandItem>
                                        {tenants?.map((t) => (
                                            <CommandItem
                                                key={t.id}
                                                onSelect={() => {
                                                    onTenantChange?.(t.slug);
                                                    setIsStoreOpen(false);
                                                }}
                                                className="py-3 cursor-pointer"
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span>{t.name}</span>
                                                    {tenantValue === t.slug && <Check className="size-4 text-green-600" />}
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    {/* Library Button */}
                    {session.data?.user && (
                        <Button
                            asChild
                            variant="outline"
                            className={cn(
                                "h-12 px-5 flex-1 md:flex-none rounded-xl hover:bg-neutral-900 hover:text-white transition-all group",
                                boldBorder
                            )}
                        >
                            <Link prefetch href="/library">
                                <BookmarkCheckIcon className="mr-2 size-4 text-green-600 group-hover:text-green-400 transition-colors" />
                                <span className="font-bold">Library</span>
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};