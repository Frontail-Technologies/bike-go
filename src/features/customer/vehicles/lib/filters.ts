export const PRICE_MIN = 5;
export const PRICE_MAX = 30;

export type SortKey = "popular" | "price-asc" | "price-desc" | "rating";

export const sortOptions: { id: SortKey; key: "sortPopular" | "sortRating" | "sortPriceAsc" | "sortPriceDesc" }[] = [
  { id: "popular", key: "sortPopular" },
  { id: "rating", key: "sortRating" },
  { id: "price-asc", key: "sortPriceAsc" },
  { id: "price-desc", key: "sortPriceDesc" },
];

export type EngineBand = "under-200" | "200-400" | "over-400";

export const engineBands: { id: EngineBand; key: "engineUnder200" | "engine200400" | "engineOver400" }[] = [
  { id: "under-200", key: "engineUnder200" },
  { id: "200-400", key: "engine200400" },
  { id: "over-400", key: "engineOver400" },
];

export type Filters = {
  category: string;
  brands: string[];
  price: [number, number];
  transmission: string[];
  engine: EngineBand[];
  availableOnly: boolean;
};

export const DEFAULT_FILTERS: Filters = {
  category: "all",
  brands: [],
  price: [PRICE_MIN, PRICE_MAX],
  transmission: [],
  engine: [],
  availableOnly: false,
};

export function activeFilterCount(filters: Filters, includeCategory = false): number {
  let count = 0;
  if (includeCategory && filters.category !== "all") count++;
  if (filters.brands.length) count++;
  if (filters.price[0] !== PRICE_MIN || filters.price[1] !== PRICE_MAX) count++;
  if (filters.transmission.length) count++;
  if (filters.engine.length) count++;
  if (filters.availableOnly) count++;
  return count;
}
