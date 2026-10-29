import { VehicleDetail } from "@/features/admin/vehicles/components/vehicle-detail";
import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/feedback";

export const instant = false;

async function VehicleDetails({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <VehicleDetail id={id} />; }
export default function VehicleDetailsPage({ params }: { params: Promise<{ id: string }> }) { return <Suspense fallback={<AdminLoadingState labelKey="vehicles.loadingVehicle" />}><VehicleDetails params={params} /></Suspense>; }
