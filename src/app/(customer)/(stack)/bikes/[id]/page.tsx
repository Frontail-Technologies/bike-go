import type { Metadata } from "next";
import { Suspense } from "react";
import { BikeDetailsRoute } from "@/features/bike-details/bike-details-route";
import { BikeDetailsSkeleton } from "@/features/bike-details/bike-details-skeleton";

export const metadata: Metadata = { title: "Vehicle details" };
export const instant = false;

export default async function BikePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Suspense fallback={<BikeDetailsSkeleton />}><BikeDetailsRoute id={id} /></Suspense>;
}
