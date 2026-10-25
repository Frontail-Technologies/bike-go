import type { Metadata } from "next";
import { Suspense } from "react";
import { BikeDetailsSkeleton } from "@/features/customer/vehicles/components/details/bike-details-skeleton";
import { BookingRoute } from "@/features/customer/bookings/components/flow/booking-route";

export const metadata: Metadata = { title: "Book" };

export const instant = false;

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<BikeDetailsSkeleton />}>
      <BookingRoute id={id} />
    </Suspense>
  );
}
