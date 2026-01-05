import { useQueryStates, parseAsString, parseAsArrayOf, parseAsStringLiteral } from "nuqs";

const sortValues = ["curated", "trending", "hot_and_new"] as const;

const params = {
    search: parseAsString
      .withOptions({
          clearOnDefault: true,
      })
      .withDefault(""),
    // ✅ ADD THIS: Track the store/tenant slug in the URL
    tenantSlug: parseAsString
      .withOptions({
          clearOnDefault: true,
      })
      .withDefault(""), 
    sort: parseAsStringLiteral(sortValues).withDefault("curated"),
    minPrice: parseAsString
          .withOptions({
              clearOnDefault: true,
          })
          .withDefault(""),
    maxPrice: parseAsString
          .withOptions({
              clearOnDefault: true,
          })
          .withDefault(""),
    tags: parseAsArrayOf(parseAsString)
          .withOptions({
              clearOnDefault: true,
          })
          .withDefault([]),
}

export const useProductFilters = () => {
    return useQueryStates(params);
};