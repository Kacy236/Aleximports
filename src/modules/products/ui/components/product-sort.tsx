import { Button } from "@/components/ui/button";

import { useProductFilters } from "../../hooks/use-product-filters"

export const ProductSort = () => {
    const [filters, setFilters] = useProductFilters();

    return (
        <div className="flex items-center gap-2">
            <Button
              size="sm"
              className={cn(
                  "rounded-full"
              )}
            >

            </Button>
        </div>
    )
}