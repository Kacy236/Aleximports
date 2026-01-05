"use client";

import { 
  SearchIcon, 
  ListFilterIcon, 
  BookmarkCheckIcon, 
  StoreIcon, 
  ChevronDownIcon,
  CheckIcon,
  XIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { CategoriesSidebar } from "./categories-sidebar";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  disabled?: boolean;
  defaultValue?: string | undefined;
  tenantValue?: string | undefined;
  placeholder?: string;
  onChange?: (value: string) => void;
  onTenantChange?: (value: string | undefined) => void;
  tenants?: any[]; 
}

export const SearchInput = ({
  disabled,
  defaultValue,
  tenantValue,
  placeholder = "Search products...",
  onChange,
  onTenantChange,
  tenants,
}: Props) => {
  const [searchValue, setSearchValue] = useState(defaultValue || "");
  const [storeSearch, setStoreSearch] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const trpc = useTRPC();
  const session = useQuery(trpc.auth.session.queryOptions());

  const activeTenantLabel = tenants?.find(t => t.slug === tenantValue)?.name || "All Stores";

  const filteredTenants = useMemo(() => {
    if (!storeSearch) return tenants;
    return tenants?.filter((t) => 
      t.name.toLowerCase().includes(storeSearch.toLowerCase())
    );
  }, [tenants, storeSearch]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onChange?.(searchValue);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchValue, onChange]);

  // Enhanced Bold Neo-Brutalism Style
  const boldBorderStyle = "border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]";

  return (
    <div className="flex flex-col gap-5 w-full max-w-2xl mx-auto p-1">
      <CategoriesSidebar open={isSidebarOpen} onOpenChange={setIsSidebarOpen} />

      {/* Row 1: Product Search + Filter (Larger Height) */}
      <div className="flex items-center gap-3 w-full">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-black z-10" />
          <Input
            className={cn(
              "pl-12 h-16 w-full bg-white rounded-2xl text-black font-black placeholder:text-neutral-500 transition-all focus-visible:ring-0 uppercase tracking-tighter",
              boldBorderStyle
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
            "size-16 shrink-0 lg:hidden rounded-2xl bg-green-400 hover:bg-green-500 transition-all",
            boldBorderStyle
          )}
          onClick={() => setIsSidebarOpen(true)}
        >
          <ListFilterIcon className="size-7 text-black" />
        </Button>
      </div>

      {/* Row 2: Maximum Length Store Selector + Library */}
      <div className="flex items-center gap-3 w-full">
        <DropdownMenu onOpenChange={(open) => !open && setStoreSearch("")}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "flex-[3] h-16 justify-between px-5 rounded-2xl transition-all bg-white hover:bg-neutral-50",
                boldBorderStyle,
                tenantValue ? "bg-green-50" : "text-black"
              )}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <StoreIcon className="size-5 shrink-0 text-black" />
                <span className="truncate font-black text-sm sm:text-base uppercase tracking-tight">
                  {activeTenantLabel}
                </span>
              </div>
              <ChevronDownIcon className="size-5 text-black shrink-0 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent 
            align="start" 
            sideOffset={8}
            // Use Viewport width minus padding for maximum length on mobile
            className="w-[calc(100vw-2rem)] sm:w-[450px] rounded-2xl p-4 border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white z-[100]"
          >
            {/* Extended Search Input inside Dropdown */}
            <div className="relative mb-4">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-black" />
              <input
                autoFocus
                placeholder="SEARCH FOR A STORE..."
                value={storeSearch}
                onChange={(e) => setStoreSearch(e.target.value)}
                className="w-full h-14 pl-12 pr-12 rounded-xl border-[3px] border-black text-base font-black focus:outline-none focus:bg-green-100 placeholder:text-black/30 uppercase tracking-tighter transition-colors"
              />
              {storeSearch && (
                <button 
                  onClick={() => setStoreSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 bg-black rounded-full hover:bg-red-500 transition-colors"
                >
                  <XIcon className="size-3.5 text-white stroke-[4px]" />
                </button>
              )}
            </div>

            {/* Increased list length for better visibility */}
            <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              <DropdownMenuItem 
                onClick={() => onTenantChange?.(undefined)}
                className="rounded-xl py-4 px-4 font-black cursor-pointer focus:bg-green-400 focus:text-black uppercase text-sm mb-2 border-2 border-transparent focus:border-black transition-all"
              >
                🌍 ALL STORES
              </DropdownMenuItem>
              
              <div className="h-[3px] bg-black my-3 rounded-full" />
              
              {filteredTenants?.length === 0 ? (
                <div className="p-10 text-center text-sm font-black text-black/40 uppercase bg-neutral-50 rounded-xl border-[3px] border-dashed border-neutral-300">
                  Store not found
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {filteredTenants?.map((tenant) => (
                    <DropdownMenuItem
                      key={tenant.id}
                      onClick={() => onTenantChange?.(tenant.slug)}
                      className="flex items-center justify-between rounded-xl py-4 px-4 font-black cursor-pointer focus:bg-green-400 focus:text-black uppercase text-sm border-2 border-transparent focus:border-black transition-all"
                    >
                      <span className="truncate mr-2">{tenant.name}</span>
                      {tenantValue === tenant.slug && (
                        <div className="bg-black rounded-full p-1">
                           <CheckIcon className="size-4 text-white stroke-[4px] shrink-0" />
                        </div>
                      )}
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Library Button (Solid & Bold) */}
        {session.data?.user && (
          <Button
            asChild
            className={cn(
              "h-16 px-6 sm:px-10 shrink-0 rounded-2xl bg-green-500 hover:bg-green-600 text-black font-black uppercase tracking-tighter",
              boldBorderStyle
            )}
          >
            <Link prefetch href="/library">
              <BookmarkCheckIcon className="size-6 sm:mr-2 stroke-[3px]" />
              <span className="hidden xs:inline text-sm">Library</span>
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};