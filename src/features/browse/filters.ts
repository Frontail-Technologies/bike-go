import { rangeOverlapsBooking } from "@/features/bookings/dates";
import type { Motorcycle } from "@/features/mock/data";

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

function inEngineBand(cc: number, band: EngineBand) {
  if (band === "under-200") return cc < 200;
  if (band === "200-400") return cc >= 200 && cc <= 400;
  return cc > 400;
}

export function isAvailable(bike: Motorcycle, start?: string | null, end?: string | null): boolean {
  if (start && end) {
    const returnsBeforeStart = bike.available || (bike.availableFrom ? start >= bike.availableFrom : false);
    return returnsBeforeStart && !rangeOverlapsBooking(bike, start, end);
  }
  return bike.available;
}

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

type QueryOptions = {
  filters: Filters;
  query?: string;
  sort?: SortKey;
  start?: string | null;
  end?: string | null;
  onlyIds?: string[];
};

export function queryBikes(bikes: Motorcycle[], { filters, query = "", sort = "popular", start, end, onlyIds }: QueryOptions): Motorcycle[] {
  const q = query.trim().toLowerCase();

  const result = bikes.filter((bike) => {
    if (onlyIds && !onlyIds.includes(bike.id)) return false;
    if (filters.category !== "all" && bike.category !== filters.category) return false;
    if (filters.brands.length && !filters.brands.includes(bike.brand)) return false;
    if (bike.pricePerDay < filters.price[0] || bike.pricePerDay > filters.price[1]) return false;
    if (filters.transmission.length && !filters.transmission.includes(bike.transmission)) return false;
    if (filters.engine.length && !filters.engine.some((band) => inEngineBand(bike.engineCc, band))) return false;
    if ((filters.availableOnly || (start && end)) && !isAvailable(bike, start, end)) return false;
    if (q && ![bike.name, bike.brand, bike.model, bike.category, bike.location].some((v) => v.toLowerCase().includes(q))) return false;
    return true;
  });

  const sorted = [...result];
  if (sort === "popular") sorted.sort((a, b) => b.reviews - a.reviews);
  if (sort === "rating") sorted.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
  if (sort === "price-asc") sorted.sort((a, b) => a.pricePerDay - b.pricePerDay);
  if (sort === "price-desc") sorted.sort((a, b) => b.pricePerDay - a.pricePerDay);
  return sorted;
}
