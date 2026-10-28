import type { Metadata } from "next";
import { Suspense } from "react";
import { BrowseView } from "@/features/customer/vehicles/components/browse/browse-view";
import { BrowseSkeleton } from "@/features/customer/vehicles/components/browse/browse-skeleton";
import { getVehicleFilterMasters } from "@/features/customer/vehicles/api/vehicle-filter-server-data";

export const metadata: Metadata = { title: "Bikes" };

export default async function BikesPage() {
  const initialMasters = await getVehicleFilterMasters();
  return (
    <Suspense fallback={<BrowseSkeleton />}>
      <BrowseView initialMasters={initialMasters} />
    </Suspense>
  );
}
