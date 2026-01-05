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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query"; // Standard hook to detect screen size

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
    placeholder = "Search...",
    onChange,
    onTenantChange,
}: Props) => {
    const [searchValue, setSearchValue] = useState(defaultValue || "");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isStoreOpen, setIsStoreOpen] = useState(false);
    
    // Check if we are on desktop for responsive components
    const isDesktop = useMediaQuery("(min-width: 768px)");

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

    // Shared Store List Component to keep code DRY
    const StoreList = () => (
        <Command className="rounded-xl">
            <CommandInput placeholder="Type store name..." className="h-12" />
            <CommandList className="max-h-[300px] md:max-h-[400px]">
                <CommandEmpty>No store found.</CommandEmpty>
                <CommandGroup>
                    <CommandItem
                        onSelect={() => { onTenantChange?.(""); setIsStoreOpen(false); }}
                        className="py-4 border-b border-neutral-100 last:border-0 cursor-pointer"
                    >
                        <div className="flex items-center justify-between w-full">
                            <span className="font-medium text-base">All Stores</span>
                            {!tenantValue && <Check className="size-5 text-green-600 stroke-[3px]" />}
                        </div>
                    </CommandItem>
                    {tenants?.map((t) => (
                        <CommandItem
                            key={t.id}
                            onSelect={() => { onTenantChange?.(t.slug); setIsStoreOpen(false); }}
                            className="py-4 border-b border-neutral-100 last:border-0 cursor-pointer"
                        >
                            <div className="flex items-center justify-between w-full">
                                <span className="font-medium text-base">{t.name}</span>
                                {tenantValue === t.slug && <Check className="size-5 text-green-600 stroke-[3px]" />}
                            </div>
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </Command>
    );

    return (
        <div className="w-full max-w-7xl mx-auto px-1">
            <CategoriesSidebar open={isSidebarOpen} onOpenChange={setIsSidebarOpen} />

            {/* MAIN WRAPPER: Column on mobile, Single Row on Desktop */}
            <div className="flex flex-col md:flex-row items-center gap-3 w-full">
                
                {/* 1. SEARCH BAR */}
                <div className="relative flex-1 w-full group">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-neutral-400 group-focus-within:text-green-600 transition-colors" />
                    <Input
                        className="pl-12 h-14 bg-white border-2 border-neutral-800 focus-visible:ring-0 focus-visible:border-green-600 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                        placeholder={placeholder}
                        disabled={disabled}
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                    />
                </div>

                {/* 2. STORE SELECTOR & FILTERS GROUP */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Store Selector Component */}
                    {isDesktop ? (
                        <Popover open={isStoreOpen} onOpenChange={setIsStoreOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "h-14 md:w-[220px] justify-between rounded-xl border-2 border-neutral-800 bg-white px-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-green-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all",
                                        tenantValue && "border-green-600 text-green-700 bg-green-50/50"
                                    )}
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <StoreIcon className="size-5 shrink-0" />
                                        <span className="font-bold">{selectedStore ? selectedStore.name : "All Stores"}</span>
                                    </div>
                                    <ChevronDown className="size-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0 border-2 border-neutral-800 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" align="end">
                                <StoreList />
                            </PopoverContent>
                        </Popover>
                    ) : (
                        <Drawer open={isStoreOpen} onOpenChange={setIsStoreOpen}>
                            <DrawerTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-14 flex-1 justify-between rounded-xl border-2 border-neutral-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                >
                                    <div className="flex items-center gap-2 truncate font-bold">
                                        <StoreIcon className="size-5" />
                                        {selectedStore ? selectedStore.name : "All Stores"}
                                    </div>
                                    <ChevronDown className="size-4" />
                                </Button>
                            </DrawerTrigger>
                            <DrawerContent className="border-t-2 border-neutral-800 p-4">
                                <DrawerHeader className="px-0 pt-0">
                                    <DrawerTitle className="text-left text-2xl font-black">Select Store</DrawerTitle>
                                </DrawerHeader>
                                <StoreList />
                            </DrawerContent>
                        </Drawer>
                    )}

                    {/* Filter Button (Mobile Only) */}
                    <Button
                        variant="outline"
                        className="size-14 shrink-0 md:hidden rounded-xl border-2 border-neutral-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-green-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <ListFilterIcon className="size-6" />
                    </Button>

                    {/* 3. LIBRARY BUTTON */}
                    {session.data?.user && (
                        <Button
                            asChild
                            variant="outline"
                            className="h-14 px-6 flex-1 md:flex-none rounded-xl border-2 border-neutral-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-green-600 hover:text-white transition-all font-bold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                        >
                            <Link prefetch href="/library">
                                <BookmarkCheckIcon className="mr-2 size-5" />
                                Library
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};