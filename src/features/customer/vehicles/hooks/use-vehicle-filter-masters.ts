"use client";

import { useQuery } from "@tanstack/react-query";
import * as api from "@/features/customer/master-data/api/master-data-api";
import { customerMasterDataKeys } from "@/features/customer/master-data/query-keys";
import type { MasterItem } from "@/features/customer/master-data/types";
import type { VehicleFilterMasters } from "../api/vehicle-filter-server-data";

function useFilterMasterItems(kind: "vehicle_category" | "brand" | "transmission", initialData: MasterItem[]) {
  return useQuery({
    queryKey: customerMasterDataKeys.listMasterItems(kind),
    queryFn: ({ signal }) => api.listMasterItems(kind, signal),
    initialData,
    // Server-rendered data may come from Next's fetch cache; paint it, then refetch at once.
    initialDataUpdatedAt: 0,
  });
}

export function useVehicleFilterMasters(initialData: VehicleFilterMasters) {
  return {
    categories: useFilterMasterItems("vehicle_category", initialData.categories),
    brands: useFilterMasterItems("brand", initialData.brands),
    transmissions: useFilterMasterItems("transmission", initialData.transmissions),
  };
}
