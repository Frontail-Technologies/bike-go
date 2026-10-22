import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BikeDetailsSkeleton } from "@/features/bike-details/bike-details-skeleton";
import { BookingFlow } from "@/features/booking-flow/booking-flow";
import { getBike, motorcycles } from "@/features/mock/data";

export const metadata: Metadata = { title: "Book" };

export function generateStaticParams() {
  return motorcycles.map((bike) => ({ id: bike.id }));
}

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bike = getBike(id);
  if (!bike) notFound();

  return (
    <Suspense fallback={<BikeDetailsSkeleton />}>
      <BookingFlow bike={bike} />
    </Suspense>
  );
}
