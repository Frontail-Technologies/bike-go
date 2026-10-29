import { cambodiaRentalRange } from "@/lib/cambodia-time";
import type { VehicleModelListParams } from "../types";
import type { Filters, SortKey } from "./filters";

const apiSort: Record<SortKey, NonNullable<VehicleModelListParams["sort"]>> = {
  "price-asc": "price_asc",
  "price-desc": "price_desc",
  popular: "newest",
  rating: "name",
};

export function modelListParams({ filters, query, sort, dates, page, pageSize }: {
  filters: Filters;
  query: string;
  sort: SortKey;
  dates: { start: string; end: string } | null;
  page: number;
  pageSize: number;
}): VehicleModelListParams {
  const engine = filters.engine[0];
  const range = dates ? cambodiaRentalRange(dates.start, dates.end) : null;
  return {
    page,
    pageSize,
    q: query.trim() || undefined,
    category: filters.category === "all" ? undefined : filters.category,
    brand: filters.brands.length ? filters.brands : undefined,
    transmission: filters.transmission.length ? filters.transmission : undefined,
    minPrice: filters.price[0] * 100,
    maxPrice: filters.price[1] * 100,
    minEngineCc: engine === "200-400" ? 200 : engine === "over-400" ? 401 : undefined,
    maxEngineCc: engine === "under-200" ? 199 : engine === "200-400" ? 400 : undefined,
    availableOnly: filters.availableOnly || undefined,
    start: range?.pickupAt,
    end: range?.returnAt,
    sort: apiSort[sort],
  };
}
