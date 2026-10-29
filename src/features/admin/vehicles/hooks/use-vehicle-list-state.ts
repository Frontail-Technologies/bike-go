"use client";

import { oneOf, useListState } from "@/hooks/use-list-state";
import { vehicleStatuses, vehicleTypes, type VehicleListParams, type VehicleSortBy } from "../types/vehicle";

export const VEHICLE_PAGE_SIZE = 10;
const sortKeys: readonly VehicleSortBy[] = ["createdAt", "name", "brand", "category", "dailyRentalPriceMinor", "status"];
const read = (search: URLSearchParams): VehicleListParams => {
  const sortBy = oneOf(sortKeys, search.get("sortBy"));
  return {
    page: Math.max(1, Number.parseInt(search.get("page") ?? "1", 10) || 1), pageSize: VEHICLE_PAGE_SIZE,
    q: search.get("q")?.trim() || undefined, status: oneOf(vehicleStatuses, search.get("status")), vehicleType: oneOf(vehicleTypes, search.get("vehicleType")),
    category: search.get("category") || undefined, locationId: search.get("locationId") || undefined, sortBy,
    sortOrder: sortBy ? oneOf(["asc", "desc"] as const, search.get("sortOrder")) ?? "asc" : undefined,
  };
};
const reset = { q: undefined, status: undefined, vehicleType: undefined, category: undefined, locationId: undefined };

export function useVehicleListState() {
  return useListState<VehicleListParams>({
    read,
    reset,
  });
}
