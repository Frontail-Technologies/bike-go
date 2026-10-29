"use client";

import { useQueries } from "@tanstack/react-query";
import { masterDataListQuery } from "@/features/admin/settings/queries";
import type { MasterItem, MasterKind, MasterPageParams } from "@/features/admin/settings/types/master-data";
import { capitalize } from "../lib/vehicle-mappers";
import { vehicleTypes, type VehicleType } from "../types/vehicle";

export type Option = { value: string; label: string };

const kinds = ["vehicle_type", "vehicle_category", "brand", "transmission", "fuel_type"] as const satisfies readonly MasterKind[];
const params: MasterPageParams = { page: 1, pageSize: 100, sortBy: "sortOrder", sortOrder: "asc" };

function selectable(items: MasterItem[], current: string | undefined, valueOf: (item: MasterItem) => string): Option[] {
  const options = items.filter((item) => item.active).map((item) => ({ value: valueOf(item), label: item.name }));
  if (current && !options.some((option) => option.value === current)) {
    const historical = items.find((item) => valueOf(item) === current);
    options.push({ value: current, label: historical ? `${historical.name} (inactive)` : current });
  }
  return options;
}

export function useVehicleOptions() {
  const results = useQueries({
    queries: kinds.map((kind) => ({ ...masterDataListQuery(kind, params), staleTime: 60_000 })),
  });
  const items = (kind: (typeof kinds)[number]) => results[kinds.indexOf(kind)].data?.data ?? [];

  return {
    isLoading: results.some((result) => result.isLoading),
    filterCategories: (): Option[] => items("vehicle_category").map((item) => ({ value: item.name, label: item.name })),
    vehicleTypes: (current?: string): Option[] =>
      vehicleTypes
        .filter((type) => type === current || items("vehicle_type").find((item) => item.code === type)?.active !== false)
        .map((type) => ({ value: type, label: items("vehicle_type").find((item) => item.code === type)?.name ?? capitalize(type) })),
    categories: (current?: string) => selectable(items("vehicle_category"), current, (item) => item.name),
    brands: (current?: string) => selectable(items("brand"), current, (item) => item.name),
    transmissions: (current?: string) => selectable(items("transmission"), current, (item) => item.name),
    fuelTypes: (current?: string) => selectable(items("fuel_type"), current, (item) => item.name),
  };
}

export type VehicleOptions = ReturnType<typeof useVehicleOptions>;
export type { VehicleType };
