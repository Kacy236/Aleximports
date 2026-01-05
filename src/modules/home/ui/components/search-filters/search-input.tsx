"use client";

import { 
    SearchIcon, 
    ListFilterIcon, 
    BookmarkCheckIcon, 
    StoreIcon, 
    Check, 
    ChevronDown,
    X
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
import { useMediaQuery } from "@/hooks/use-media-query";

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

    const handleClearSearch = () => {
        setSearchValue("");
        onChange?.("");
    };

    // SHARED STORE LIST COMPONENT
    const StoreList = () => (
        <Command className="rounded-xl overflow-hidden pointer-events-auto bg-white">
            <CommandInput 
                placeholder="Search store name..." 
                className="h-12 text-base border-none focus:ring-0" 
                autoFocus={true} 
            />
            <CommandList className="max-h-[350px] overflow-y-auto overscroll-contain p-2">
                <CommandEmpty className="py-6 text-center text-sm text-neutral-500">No store found.</CommandEmpty>
                <CommandGroup>
                    <CommandItem
                        onSelect={() => { onTenantChange?.(""); setIsStoreOpen(false); }}
                        className="py-3 px-4 rounded-lg cursor-pointer aria-selected:bg-green-50 aria-selected:text-green-700"
                    >
                        <div className="flex items-center justify-between w-full">
                            <span className="font-bold">All Stores</span>
                            {!tenantValue && <Check className="size-5 text-green-600 stroke-[3px]" />}
                        </div>
                    </CommandItem>
                    {tenants?.map((t) => (
                        <CommandItem
                            key={t.id}
                            onSelect={() => { onTenantChange?.(t.slug); setIsStoreOpen(false); }}
                            className="py-3 px-4 rounded-lg cursor-pointer aria-selected:bg-green-50 aria-selected:text-green-700 mt-1"
                        >
                            <div className="flex items-center justify-between w-full">
                                <span className="font-bold">{t.name}</span>
                                {tenantValue === t.slug && <Check className="size-5 text-green-600 stroke-[3px]" />}
                            </div>
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </Command>
    );

    return (
        <div className="w-full max-w-7xl mx-auto">
            <CategoriesSidebar open={isSidebarOpen} onOpenChange={setIsSidebarOpen} />

            {/* Desktop: Single Row | Mobile: Stacked Row */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full">
                
                {/* 1. SEARCH BAR WITH CLEAR BUTTON */}
                <div className="relative flex-1 group">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-neutral-400 group-focus-within:text-green-600 transition-colors z-10" />
                    <Input
                        className="pl-12 pr-12 h-14 bg-white border-2 border-neutral-900 focus-visible:ring-0 focus-visible:border-green-600 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-base font-medium placeholder:text-neutral-400 transition-all"
                        placeholder={placeholder}
                        disabled={disabled}
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                    />
                    {searchValue && (
                        <button
                            onClick={handleClearSearch}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 transition-colors z-10"
                        >
                            <X className="size-5 stroke-[2.5px]" />
                        </button>
                    )}
                </div>

                {/* 2. ACTIONS GROUP */}
                <div className="flex items-center gap-3">
                    {/* Store Selector (Popover for Desktop, Drawer for Mobile) */}
                    {isDesktop ? (
                        <Popover open={isStoreOpen} onOpenChange={setIsStoreOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "h-14 min-w-[200px] justify-between rounded-xl border-2 border-neutral-900 bg-white px-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-green-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all",
                                        tenantValue && "border-green-600 text-green-700 bg-green-50/50"
                                    )}
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <StoreIcon className={cn("size-5 shrink-0", tenantValue && "text-green-600")} />
                                        <span className="font-black">{selectedStore ? selectedStore.name : "All Stores"}</span>
                                    </div>
                                    <ChevronDown className="size-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent 
                                className="w-[300px] p-0 border-2 border-neutral-900 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden" 
                                align="end"
                                onOpenAutoFocus={(e) => e.preventDefault()}
                            >
                                <StoreList />
                            </PopoverContent>
                        </Popover>
                    ) : (
                        <Drawer open={isStoreOpen} onOpenChange={setIsStoreOpen}>
                            <DrawerTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "h-14 flex-1 justify-between rounded-xl border-2 border-neutral-900 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                                        tenantValue && "border-green-600 text-green-700"
                                    )}
                                >
                                    <div className="flex items-center gap-2 truncate font-black">
                                        <StoreIcon className="size-5" />
                                        {selectedStore ? selectedStore.name : "All Stores"}
                                    </div>
                                    <ChevronDown className="size-4" />
                                </Button>
                            </DrawerTrigger>
                            <DrawerContent 
                                className="border-t-2 border-neutral-900 p-4 pb-12"
                                onOpenAutoFocus={(e) => e.preventDefault()}
                            >
                                <DrawerHeader className="px-0 pt-0 text-left">
                                    <DrawerTitle className="text-2xl font-black text-neutral-900">Select Store</DrawerTitle>
                                </DrawerHeader>
                                <StoreList />
                            </DrawerContent>
                        </Drawer>
                    )}

                    {/* Filter Button (Mobile Only) */}
                    <Button
                        variant="outline"
                        className="size-14 shrink-0 md:hidden rounded-xl border-2 border-neutral-900 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <ListFilterIcon className="size-6" />
                    </Button>

                    {/* Library Button */}
                    {session.data?.user && (
                        <Button
                            asChild
                            variant="outline"
                            className="h-14 px-6 flex-1 md:flex-none rounded-xl border-2 border-neutral-900 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-green-600 hover:text-white transition-all font-black active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
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