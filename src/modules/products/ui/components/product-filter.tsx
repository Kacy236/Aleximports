interface Props {
    minPrice?: string | null;
    maxPrice?: string | null;
    onMinPriceChange: (value: string) => void;
    onMaxPriceChange: (value: string) => void;
}

export const formatAsCurrency = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, "");

    const parts = numericValue.split(".");
    const formattedValue = 
      parts[0] + (parts.length > 1 ? "." + parts[1]?.slice(0, 2): "");

      if (!formattedValue) return "";

      const numberValue = parseFloat(formattedValue);
}