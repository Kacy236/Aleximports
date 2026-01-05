"use client";

import { SearchIcon, ListFilterIcon, BookmarkCheckIcon, StoreIcon } from "lucide-react";
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
    <div className="flex flex-col gap-3 w-full">
      <CategoriesSidebar open={isSidebarOpen} onOpenChange={setIsSidebarOpen} />

      {/* Row 1: Search Products + Filter Button beside it */}
      <div className="flex items-center gap-2 w-full">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
          <Input
            className="pl-8 h-12 w-full bg-white shadow-sm"
            placeholder={placeholder}
            disabled={disabled}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>

        {/* Filter Button (Beside Search) */}
        <Button
          variant="elevated"
          className="size-12 shrink-0 lg:hidden"
          onClick={() => setIsSidebarOpen(true)}
        >
          <ListFilterIcon className="size-5" />
        </Button>
      </div>

      {/* Row 2: Store Selector + Library Button beside it */}
      <div className="flex items-center gap-2 w-full">
        {/* Store Selection Dropdown */}
        <div className="relative flex-1 min-w-[120px]">
          <select
            value={tenantValue || ""}
            onChange={(e) => onTenantChange?.(e.target.value || undefined)}
            className="w-full h-12 pl-3 pr-8 bg-white border border-neutral-200 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 font-medium text-sm shadow-sm"
          >
            <option value="">All Stores</option>
            {tenants?.map((tenant) => (
              <option key={tenant.id} value={tenant.slug}>
                {tenant.name}
              </option>
            ))}
          </select>
          <StoreIcon className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none" />
        </div>

        {/* Library Button with Text always visible */}
        {session.data?.user && (
          <Button
            asChild
            variant="elevated"
            className="h-12 px-4 shrink-0"
          >
            <Link prefetch href="/library">
              <BookmarkCheckIcon className="size-4 mr-2" />
              <span className="inline font-medium text-sm">Library</span>
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};