import { ChangeEvent } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
    minPrice?: string | null;
    maxPrice?: string | null;
    onMinPriceChange: (value: string) => void;
    onMaxPriceChange: (value: string) => void;
}

export const formatAsCurrency = (value: string) => {
    // Remove everything except numbers and the decimal point
    const numericValue = value.replace(/[^0-9.]/g, "");

    const parts = numericValue.split(".");
    const formattedValue = 
      parts[0] + (parts.length > 1 ? "." + parts[1]?.slice(0, 2): "");

    if (!formattedValue) return "";

    const numberValue = parseFloat(formattedValue);
    if(isNaN(numberValue)) return "";

    // Updated to Nigerian Naira (en-NG locale and NGN currency)
    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(numberValue);
};

export const PriceFilter = ({
    minPrice,
    maxPrice,
    onMinPriceChange,
    onMaxPriceChange,
}: Props) => {
    const handleMinPriceChange = (e: ChangeEvent<HTMLInputElement>) => {
        // Extract only numeric values for the raw state
        const numericValue = e.target.value.replace(/[^0-9]/g, "");
        onMinPriceChange(numericValue);
    };

    const handleMaxPriceChange = (e: ChangeEvent<HTMLInputElement>) => {
        // Extract only numeric values for the raw state
        const numericValue = e.target.value.replace(/[^0-9]/g, "");
        onMaxPriceChange(numericValue);
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <Label className="font-medium text-base text-gray-700">
                    Minimum Price
                </Label>
                <Input
                  type="text"
                  placeholder="₦0"
                  value={minPrice ? formatAsCurrency(minPrice) : ""}
                  onChange={handleMinPriceChange}
                  className="focus-visible:ring-green-500"
                />
            </div>
            <div className="flex flex-col gap-2">
                <Label className="font-medium text-base text-gray-700">
                    Maximum Price
                </Label>
                <Input
                  type="text"
                  placeholder="₦ Max"
                  value={maxPrice ? formatAsCurrency(maxPrice) : ""}
                  onChange={handleMaxPriceChange}
                  className="focus-visible:ring-green-500"
                />
            </div>
        </div>
    )
}