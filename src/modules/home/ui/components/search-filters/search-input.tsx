"use client";

import { SearchIcon, ListFilterIcon, BookmarkCheckIcon, StoreIcon, ChevronDownIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CategoriesSidebar } from "./categories-sidebar";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onChange?.(searchValue);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchValue, onChange]);

  return (
    <div className="flex flex-col gap-3 w-full max-w-2xl mx-auto">
      <CategoriesSidebar open={isSidebarOpen} onOpenChange={setIsSidebarOpen} />

      {/* Row 1: High-Contrast Search Bar */}
      <div className="flex items-center gap-2 w-full group">
        <div className="relative flex-1 group">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-green-600 transition-colors group-focus-within:text-green-700" />
          <Input
            className={cn(
              "pl-10 h-12 w-full bg-white border-neutral-200 rounded-xl shadow-sm transition-all",
              "focus-visible:ring-green-500/20 focus-visible:border-green-500 focus-visible:ring-4",
              "placeholder:text-neutral-400 font-medium"
            )}
            placeholder={placeholder}
            disabled={disabled}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>

        {/* Filter Button - Styled as a secondary green action */}
        <Button
          variant="outline"
          className={cn(
            "size-12 shrink-0 lg:hidden rounded-xl border-neutral-200 bg-white shadow-sm hover:bg-green-50 hover:border-green-200 group transition-all",
            "active:scale-95"
          )}
          onClick={() => setIsSidebarOpen(true)}
        >
          <ListFilterIcon className="size-5 text-neutral-600 group-hover:text-green-600" />
        </Button>
      </div>

      {/* Row 2: Store + Library with refined branding */}
      <div className="flex items-center gap-2 w-full">
        {/* Store Selection Dropdown - Minimalist Green Tint */}
        <div className="relative flex-1 group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <StoreIcon className="size-4 text-green-600" />
          </div>
          <select
            value={tenantValue || ""}
            onChange={(e) => onTenantChange?.(e.target.value || undefined)}
            className={cn(
              "w-full h-12 pl-9 pr-10 bg-white/80 border border-neutral-200 rounded-xl appearance-none",
              "focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500",
              "font-semibold text-sm text-neutral-700 transition-all shadow-sm cursor-pointer"
            )}
          >
            <option value="">All Stores</option>
            {tenants?.map((tenant) => (
              <option key={tenant.id} value={tenant.slug}>
                {tenant.name}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none group-hover:text-green-600 transition-colors" />
        </div>

        {/* Library Button - Solid Branding */}
        {session.data?.user && (
          <Button
            asChild
            className={cn(
              "h-12 px-5 shrink-0 rounded-xl shadow-md transition-all active:scale-95",
              "bg-green-600 hover:bg-green-700 text-white border-none font-bold"
            )}
          >
            <Link prefetch href="/library">
              <BookmarkCheckIcon className="size-4 mr-2" />
              <span className="text-sm tracking-tight">Library</span>
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};