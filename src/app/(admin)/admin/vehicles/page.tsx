import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/feedback";
import { VehicleList } from "@/features/admin/vehicles/components/vehicle-list";

export default function VehiclesPage() {
  return <Suspense fallback={<AdminLoadingState labelKey="vehicles.loading" />}><VehicleList /></Suspense>;
}
