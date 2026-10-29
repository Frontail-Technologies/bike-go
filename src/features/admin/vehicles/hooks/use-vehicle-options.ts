"use client";

import { useQuery } from "@tanstack/react-query";
import { vehiclesApi, type VehicleOption } from "../api/vehicles-api";
import type { VehicleType } from "../types/vehicle";
import { adminT } from "@/features/admin/i18n/translate";

export type Option = { value: string; label: string };

function selectable(items: VehicleOption[], current?: string): Option[] {
  const options = items.filter((item) => item.active).map(({ value, label }) => ({ value, label }));
  if (current && !options.some((option) => option.value === current)) {
    const historical = items.find((item) => item.value === current);
    options.push({ value: current, label: historical ? adminT("common.inactiveSuffix", { label: historical.label }) : current });
  }
  return options;
}

export function useVehicleOptions() {
  const query = useQuery({ queryKey: ["admin", "vehicles", "options"], queryFn: vehiclesApi.options, staleTime: 60_000 });
  const data = query.data ?? { vehicleTypes: [], categories: [], brands: [], transmissions: [], fuelTypes: [] };
  return {
    isLoading: query.isLoading,
    filterCategories: (): Option[] => data.categories.map(({ value, label }) => ({ value, label })),
    vehicleTypes: (current?: string) => selectable(data.vehicleTypes, current),
    categories: (current?: string) => selectable(data.categories, current),
    brands: (current?: string) => selectable(data.brands, current),
    transmissions: (current?: string) => selectable(data.transmissions, current),
    fuelTypes: (current?: string) => selectable(data.fuelTypes, current),
  };
}

export type VehicleOptions = ReturnType<typeof useVehicleOptions>;
export type { VehicleType };
