import { rangeOverlapsBooking } from "@/features/bookings/dates";
import type { Motorcycle } from "@/features/mock/data";

export const PRICE_MIN = 5;
export const PRICE_MAX = 30;

export type SortKey = "popular" | "price-asc" | "price-desc" | "rating";

export const sortOptions: { id: SortKey; label: string }[] = [
  { id: "popular", label: "Most popular" },
  { id: "rating", label: "Top rated" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
];

export type EngineBand = "under-200" | "200-400" | "over-400";

export const engineBands: { id: EngineBand; label: string }[] = [
  { id: "under-200", label: "Under 200cc" },
  { id: "200-400", label: "200 – 400cc" },
  { id: "over-400", label: "Over 400cc" },
];

export type Filters = {
  /** "all" or a BikeCategory. */
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

/** Available now, or for the whole range when dates are chosen. */
export function isAvailable(bike: Motorcycle, start?: string | null, end?: string | null): boolean {
  if (start && end) {
    const returnsBeforeStart = bike.available || (bike.availableFrom ? start >= bike.availableFrom : false);
    return returnsBeforeStart && !rangeOverlapsBooking(bike, start, end);
  }
  return bike.available;
}

/**
 * Number of filters differing from the defaults. The category is excluded by default because desktop shows
 * it as tabs; pass `includeCategory` where it only lives inside Filters (the phone app bar badge).
 */
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
  /** Restrict to these ids (saved bikes). */
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
