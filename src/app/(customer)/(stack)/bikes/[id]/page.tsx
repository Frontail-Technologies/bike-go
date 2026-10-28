import type { Metadata } from "next";
import { Suspense } from "react";
import { BikeDetailsRoute } from "@/features/customer/vehicles/components/details/bike-details-route";
import { BikeDetailsSkeleton } from "@/features/customer/vehicles/components/details/bike-details-skeleton";
import { getVehicleForMetadata, primaryImageUrl } from "@/features/customer/vehicles/api/vehicle-metadata-server";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const vehicle = await getVehicleForMetadata(id);
  if (!vehicle) return { title: "Vehicle details" };

  const description = vehicle.description ?? `Rent the ${vehicle.brand} ${vehicle.model} with RideGo — flexible dates, free cancellation.`;
  const image = primaryImageUrl(vehicle.images);

  return {
    title: vehicle.name,
    description,
    openGraph: { title: vehicle.name, description, images: image ? [{ url: image }] : undefined },
    twitter: { card: "summary_large_image", title: vehicle.name, description, images: image ? [image] : undefined },
  };
}

export default async function BikePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Suspense fallback={<BikeDetailsSkeleton />}><BikeDetailsRoute id={id} /></Suspense>;
}
