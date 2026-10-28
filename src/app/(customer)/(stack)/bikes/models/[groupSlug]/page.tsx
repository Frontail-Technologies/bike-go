import type { Metadata } from "next";
import { Suspense } from "react";
import { GroupDetailsRoute } from "@/features/customer/vehicles/components/details/group-details-route";
import { BikeDetailsSkeleton } from "@/features/customer/vehicles/components/details/bike-details-skeleton";

export const metadata: Metadata = { title: "Vehicle details" };
export const instant = false;

export default async function BikeGroupPage({ params }: { params: Promise<{ groupSlug: string }> }) {
  const { groupSlug } = await params;
  return <Suspense fallback={<BikeDetailsSkeleton variant="group" />}><GroupDetailsRoute groupSlug={groupSlug} /></Suspense>;
}
