"use client";

import { 
  SearchIcon, 
  ListFilterIcon, 
  BookmarkCheckIcon, 
  StoreIcon, 
  ChevronDownIcon,
  CheckIcon 
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
  placeholder = "Search...",
  onChange,
  onTenantChange,
  tenants,
}: Props) => {
  const [searchValue, setSearchValue] = useState(defaultValue || "");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const trpc = useTRPC();
  const session = useQuery(trpc.auth.session.queryOptions());

  const activeTenantLabel = tenants?.find(t => t.slug === tenantValue)?.name || "All Stores";

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onChange?.(searchValue);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchValue, onChange]);

  // Common styling for the bold "Neo-brutalism" look
  const boldBorderStyle = "border-[2.5px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]";

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto p-1">
      <CategoriesSidebar open={isSidebarOpen} onOpenChange={setIsSidebarOpen} />

      {/* Row 1: Search Bar + Filter */}
      <div className="flex items-center gap-3 w-full group">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-black z-10" />
          <Input
            className={cn(
              "pl-10 h-14 w-full bg-white rounded-xl text-black font-bold placeholder:text-neutral-500 transition-all focus-visible:ring-0",
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
            "size-14 shrink-0 lg:hidden rounded-xl bg-green-400 hover:bg-green-500 transition-all",
            boldBorderStyle
          )}
          onClick={() => setIsSidebarOpen(true)}
        >
          <ListFilterIcon className="size-6 text-black" />
        </Button>
      </div>

      {/* Row 2: Modern Store Selector + Library */}
      <div className="flex items-center gap-3 w-full">
        {/* Modern Dropdown Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "flex-1 h-14 justify-between px-4 rounded-xl transition-all bg-white hover:bg-neutral-50",
                boldBorderStyle,
                tenantValue ? "bg-green-50" : "text-black"
              )}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <StoreIcon className="size-4 shrink-0 text-black" />
                <span className="truncate font-black text-sm uppercase tracking-tight">
                  {activeTenantLabel}
                </span>
              </div>
              <ChevronDownIcon className="size-4 text-black shrink-0 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            className="w-[240px] rounded-xl p-1 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <DropdownMenuItem 
              onClick={() => onTenantChange?.(undefined)}
              className="rounded-lg py-3 font-bold cursor-pointer focus:bg-green-400 focus:text-black"
            >
              ALL STORES
            </DropdownMenuItem>
            <div className="h-[2px] bg-black my-1" />
            {tenants?.map((tenant) => (
              <DropdownMenuItem
                key={tenant.id}
                onClick={() => onTenantChange?.(tenant.slug)}
                className="flex items-center justify-between rounded-lg py-3 font-bold cursor-pointer focus:bg-green-400 focus:text-black"
              >
                {tenant.name.toUpperCase()}
                {tenantValue === tenant.slug && <CheckIcon className="size-4 stroke-[3px]" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Library Button */}
        {session.data?.user && (
          <Button
            asChild
            className={cn(
              "h-14 px-6 shrink-0 rounded-xl bg-green-500 hover:bg-green-600 text-black font-black uppercase tracking-tighter",
              boldBorderStyle
            )}
          >
            <Link prefetch href="/library">
              <BookmarkCheckIcon className="size-5 mr-2 stroke-[3px]" />
              <span className="text-sm">Library</span>
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};