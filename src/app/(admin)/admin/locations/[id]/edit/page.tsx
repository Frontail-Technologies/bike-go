import { LocationFormPage } from "@/components/admin/locations/location-form";
import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/feedback";

async function EditLocation({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <LocationFormPage id={id} />; }
export default function EditLocationPage({ params }: { params: Promise<{ id: string }> }) { return <Suspense fallback={<AdminLoadingState label="Loading location form…" />}><EditLocation params={params} /></Suspense>; }
