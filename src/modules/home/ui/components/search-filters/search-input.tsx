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

    return (
        <div className="flex flex-col gap-3 w-full max-w-4xl mx-auto">
            <CategoriesSidebar open={isSidebarOpen} onOpenChange={setIsSidebarOpen} />

            {/* Top Row: Search & Category Toggle */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1 group">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400 group-focus-within:text-green-600 transition-colors" />
                    <Input
                        className="pl-9 h-12 bg-white border-neutral-200 focus-visible:ring-green-500 rounded-xl shadow-sm"
                        placeholder={placeholder}
                        disabled={disabled}
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                    />
                </div>

                <Button
                    variant="outline"
                    className="size-12 shrink-0 md:hidden rounded-xl border-neutral-200 hover:bg-green-50 hover:text-green-600 transition-all"
                    onClick={() => setIsSidebarOpen(true)}
                >
                    <ListFilterIcon className="size-5" />
                </Button>
            </div>

            {/* Bottom Row: Custom Store Selector & Library */}
            <div className="flex items-center gap-2">
                <Popover open={isStoreOpen} onOpenChange={setIsStoreOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isStoreOpen}
                            className={cn(
                                "h-12 flex-1 md:flex-none md:min-w-[200px] justify-between rounded-xl bg-white border-neutral-200 px-4 font-normal hover:bg-green-50/50",
                                tenantValue && "border-green-200 bg-green-50/30 text-green-700"
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
                    <PopoverContent className="w-[280px] p-0 rounded-xl shadow-xl border-neutral-100" align="start">
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

                {session.data?.user && (
                    <Button
                        asChild
                        variant="outline"
                        className="h-12 px-5 flex-1 md:flex-none rounded-xl border-neutral-200 hover:bg-green-600 hover:text-white hover:border-green-600 transition-all group"
                    >
                        <Link prefetch href="/library">
                            <BookmarkCheckIcon className="mr-2 size-4 text-green-600 group-hover:text-white transition-colors" />
                            <span className="font-medium">Library</span>
                        </Link>
                    </Button>
                )}
            </div>
        </div>
    );
};