"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  SearchIcon, 
  ListFilterIcon, 
  BookmarkCheckIcon, 
  StoreIcon, 
  Check, 
  ChevronsUpDown 
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { CategoriesSidebar } from "./categories-sidebar";

// Shadcn UI Components
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Props {
  disabled?: boolean;
  defaultValue?: string | undefined;
  tenantValue?: string | undefined;
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

  const trpc = useTRPC();
  const session = useQuery(trpc.auth.session.queryOptions());
  const { data: tenants } = useQuery(trpc.tenants.getMany.queryOptions());

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onChange?.(searchValue);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchValue, onChange]);

  /**
   * REUSABLE STORE SELECTOR COMPONENT
   * Features: Internal Search Bar, Scrollable List (max 6 items visible), Mobile Friendly
   */
  const StoreSelector = () => (
    <Popover open={isStoreOpen} onOpenChange={setIsStoreOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isStoreOpen}
          disabled={disabled}
          className="w-full h-12 justify-between bg-white pl-9 font-normal hover:bg-white border-input shadow-sm"
        >
          <StoreIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
          <span className="truncate">
            {tenantValue
              ? tenants?.find((t) => t.slug === tenantValue)?.name
              : "All Stores"}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0 shadow-xl border-neutral-200" align="start">
        <Command>
          {/* Internal search bar for stores */}
          <CommandInput placeholder="Search 100+ stores..." className="h-10" />
          <CommandList className="max-h-[280px] overflow-y-auto">
            <CommandEmpty>No store found.</CommandEmpty>
            <CommandGroup heading="Stores">
              <CommandItem
                value="all-stores"
                onSelect={() => {
                  onTenantChange?.("");
                  setIsStoreOpen(false);
                }}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 size-4",
                    !tenantValue ? "opacity-100" : "opacity-0"
                  )}
                />
                All Stores
              </CommandItem>
              {tenants?.map((t) => (
                <CommandItem
                  key={t.id}
                  value={t.name} // This is what the search input filters against
                  onSelect={() => {
                    onTenantChange?.(t.slug);
                    setIsStoreOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      tenantValue === t.slug ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {t.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="flex flex-col gap-2 w-full">
      <CategoriesSidebar open={isSidebarOpen} onOpenChange={setIsSidebarOpen} />

      {/* TOP ROW: Search Bar + Sidebar Trigger (Mobile) + Store Select (Desktop) */}
      <div className="flex items-center gap-2 w-full">
        <div className="relative w-full">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
          <Input
            className="pl-8 h-12 bg-white"
            placeholder={placeholder}
            disabled={disabled}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>

        {/* Categories trigger - only visible on mobile */}
        <Button
          variant="elevated"
          className="size-12 shrink-0 flex md:hidden bg-white"
          onClick={() => setIsSidebarOpen(true)}
        >
          <ListFilterIcon />
        </Button>

        {/* Desktop Store Selector */}
        <div className="hidden md:block min-w-[200px]">
          <StoreSelector />
        </div>
      </div>

      {/* BOTTOM ROW: Store Select (Mobile) + Library Button */}
      <div className="flex items-center gap-2 w-full">
        {/* Mobile Store Selector (Wrapped under search bar) */}
        <div className="flex-1 md:hidden">
          <StoreSelector />
        </div>

        {/* Library Button - Always visible beside store selector on mobile */}
        {session.data?.user && (
          <Button
            asChild
            variant="elevated"
            className="h-12 px-4 flex-1 md:flex-none md:min-w-[140px] bg-white"
          >
            <Link prefetch href="/library">
              <BookmarkCheckIcon className="mr-2 size-4" />
              Library
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};