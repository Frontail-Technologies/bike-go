import "server-only";

import type { ApiEnvelope } from "@/lib/api/contracts";
import type { MasterItem } from "@/features/customer/master-data/types";

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1").replace(/\/$/, "");

async function getMasterItems(kind: "vehicle_category" | "brand" | "transmission"): Promise<MasterItem[]> {
  try {
    const response = await fetch(`${apiBaseUrl}/master-data/${kind}`, { next: { revalidate: 300 }, headers: { Accept: "application/json" } });
    if (!response.ok) return [];
    const body = await response.json() as ApiEnvelope<MasterItem[]>;
    return body.data;
  } catch {
    return [];
  }
}

export type VehicleFilterMasters = {
  categories: MasterItem[];
  brands: MasterItem[];
  transmissions: MasterItem[];
};

export async function getVehicleFilterMasters(): Promise<VehicleFilterMasters> {
  const [categories, brands, transmissions] = await Promise.all([
    getMasterItems("vehicle_category"),
    getMasterItems("brand"),
    getMasterItems("transmission"),
  ]);
  return { categories, brands, transmissions };
}
