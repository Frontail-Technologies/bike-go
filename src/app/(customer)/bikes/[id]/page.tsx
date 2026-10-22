import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BikeDetailsSkeleton } from "@/features/bike-details/bike-details-skeleton";
import { BikeDetailsView } from "@/features/bike-details/bike-details-view";
import { getBike, motorcycles } from "@/features/mock/data";

export function generateStaticParams() {
  return motorcycles.map((bike) => ({ id: bike.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const bike = getBike(id);
  return { title: bike ? bike.name : "Bike not found" };
}

export default async function BikePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bike = getBike(id);
  if (!bike) notFound();

  return (
    <Suspense fallback={<BikeDetailsSkeleton />}>
      <BikeDetailsView bike={bike} />
    </Suspense>
  );
}
