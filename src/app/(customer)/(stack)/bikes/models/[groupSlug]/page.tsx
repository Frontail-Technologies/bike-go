import type { Metadata } from "next";
import { Suspense } from "react";
import { GroupDetailsRoute } from "@/features/customer/vehicles/components/details/group-details-route";
import { BikeDetailsSkeleton } from "@/features/customer/vehicles/components/details/bike-details-skeleton";
import { getVehicleModelForMetadata, primaryImageUrl } from "@/features/customer/vehicles/api/vehicle-metadata-server";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ groupSlug: string }> }): Promise<Metadata> {
  const { groupSlug } = await params;
  const group = await getVehicleModelForMetadata(groupSlug);
  if (!group) return { title: "Vehicle details" };

  const description = group.description ?? `Rent the ${group.brand} ${group.model} with RideGo — flexible dates, free cancellation.`;
  const image = primaryImageUrl(group.images);

  return {
    title: group.name,
    description,
    openGraph: { title: group.name, description, images: image ? [{ url: image }] : undefined },
    twitter: { card: "summary_large_image", title: group.name, description, images: image ? [image] : undefined },
  };
}

export default async function BikeGroupPage({ params }: { params: Promise<{ groupSlug: string }> }) {
  const { groupSlug } = await params;
  return <Suspense fallback={<BikeDetailsSkeleton variant="group" />}><GroupDetailsRoute groupSlug={groupSlug} /></Suspense>;
}
