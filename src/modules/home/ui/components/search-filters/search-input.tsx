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

    // Bold border utility
    const boldBorder = "border-2 border-neutral-900 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";

    return (
        <div className="w-full max-w-7xl mx-auto px-4">
            <CategoriesSidebar open={isSidebarOpen} onOpenChange={setIsSidebarOpen} />

            {/* Main Wrapper: 
                Mobile: flex-col (Group 1 and Group 2 stack)
                Desktop: flex-row (Everything stays on one line)
            */}
            <div className="flex flex-col md:flex-row items-center gap-3 w-full">
                
                {/* GROUP 1: Search & Categories Toggle (Side-by-side on Mobile) */}
                <div className="flex items-center gap-2 w-full md:flex-1">
                    <div className="relative flex-1 group">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400 group-focus-within:text-black transition-colors" />
                        <Input
                            className={cn(
                                "pl-9 h-12 bg-white rounded-xl font-medium",
                                boldBorder
                            )}
                            placeholder={placeholder}
                            disabled={disabled}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                        />
                    </div>

                    <Button
                        variant="outline"
                        className={cn(
                            "size-12 shrink-0 md:hidden rounded-xl bg-white hover:bg-neutral-50",
                            boldBorder
                        )}
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <ListFilterIcon className="size-5" />
                    </Button>
                </div>

                {/* GROUP 2: Store Selector & Library (Side-by-side on Mobile) */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Popover open={isStoreOpen} onOpenChange={setIsStoreOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                    "h-12 flex-1 md:w-[180px] justify-between rounded-xl bg-white px-4 font-bold hover:bg-neutral-50",
                                    boldBorder,
                                    tenantValue && "bg-green-50 border-green-600 text-green-700"
                                )}
                                disabled={disabled}
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <StoreIcon className="size-4 shrink-0" />
                                    <span className="truncate">{selectedStore ? selectedStore.name : "All Stores"}</span>
                                </div>
                                <ChevronDown className="size-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[250px] p-0 rounded-xl border-2 border-neutral-900 shadow-xl" align="end">
                            <Command>
                                <CommandInput placeholder="Search stores..." />
                                <CommandList>
                                    <CommandEmpty>No store found.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem
                                            onSelect={() => { onTenantChange?.(""); setIsStoreOpen(false); }}
                                            className="cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <span>All Stores</span>
                                                {!tenantValue && <Check className="size-4 text-green-600" />}
                                            </div>
                                        </CommandItem>
                                        {tenants?.map((t) => (
                                            <CommandItem
                                                key={t.id}
                                                onSelect={() => { onTenantChange?.(t.slug); setIsStoreOpen(false); }}
                                                className="cursor-pointer"
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="truncate">{t.name}</span>
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
                            className={cn(
                                "h-12 px-5 flex-1 md:flex-none rounded-xl bg-white hover:bg-neutral-900 hover:text-white transition-all group",
                                boldBorder
                            )}
                        >
                            <Link href="/library">
                                <BookmarkCheckIcon className="mr-2 size-4 text-green-600 group-hover:text-green-400" />
                                <span className="font-black uppercase text-xs tracking-wider">Library</span>
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};