import { VehicleFormPage } from "@/features/admin/vehicles/components/vehicle-form";
import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/feedback";

export const instant = false;

async function EditVehicle({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <VehicleFormPage id={id} />; }
export default function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) { return <Suspense fallback={<AdminLoadingState label="Loading vehicle form…" />}><EditVehicle params={params} /></Suspense>; }
