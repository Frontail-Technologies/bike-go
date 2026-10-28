import type { Metadata } from "next";
import { FiltersScreen } from "@/features/customer/vehicles/components/browse/filters-screen";
import { getVehicleFilterMasters } from "@/features/customer/vehicles/api/vehicle-filter-server-data";

export const metadata: Metadata = { title: "Filters" };

export default async function FiltersPage() {
  const initialMasters = await getVehicleFilterMasters();
  return <FiltersScreen initialMasters={initialMasters} />;
}
