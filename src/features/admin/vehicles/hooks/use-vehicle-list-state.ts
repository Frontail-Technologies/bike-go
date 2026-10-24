"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { vehicleStatuses, vehicleTypes, type VehicleListParams, type VehicleSortBy } from "../types/vehicle";

export const VEHICLE_PAGE_SIZE = 10;
const sortKeys: readonly VehicleSortBy[] = ["createdAt", "name", "brand", "category", "dailyRentalPriceMinor", "status"];
type Filters = Pick<VehicleListParams, "q" | "status" | "vehicleType" | "category" | "locationId" | "sortBy" | "sortOrder">;

const oneOf = <T extends string>(values: readonly T[], value: string | null) => values.find((item) => item === value);

/** The list's whole state lives in the URL, so it survives refresh and back/forward navigation. */
export function useVehicleListState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = useMemo<VehicleListParams>(() => {
    const page = Number.parseInt(searchParams.get("page") ?? "1", 10);
    const sortBy = oneOf(sortKeys, searchParams.get("sortBy"));
    return {
      page: Number.isFinite(page) && page > 0 ? page : 1,
      pageSize: VEHICLE_PAGE_SIZE,
      q: searchParams.get("q")?.trim() || undefined,
      status: oneOf(vehicleStatuses, searchParams.get("status")),
      vehicleType: oneOf(vehicleTypes, searchParams.get("vehicleType")),
      category: searchParams.get("category") || undefined,
      locationId: searchParams.get("locationId") || undefined,
      sortBy,
      sortOrder: sortBy ? oneOf(["asc", "desc"] as const, searchParams.get("sortOrder")) ?? "asc" : undefined,
    };
  }, [searchParams]);

  const write = useCallback((next: Partial<VehicleListParams>) => {
    const merged: VehicleListParams = { ...params, ...next };
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (key === "pageSize" || value === undefined || value === "" || (key === "page" && value === 1)) continue;
      query.set(key, String(value));
    }
    const search = query.toString();
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
  }, [params, pathname, router]);

  return {
    params,
    setPage: (page: number) => write({ page }),
    /** Changing any filter or the sort returns to the first page. */
    setFilters: (filters: Partial<Filters>) => write({ ...filters, page: 1 }),
    reset: () => write({ q: undefined, status: undefined, vehicleType: undefined, category: undefined, locationId: undefined, page: 1 }),
  };
}
