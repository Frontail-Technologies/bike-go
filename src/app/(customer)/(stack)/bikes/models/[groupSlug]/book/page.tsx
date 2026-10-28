import type { Metadata } from "next";
import { Suspense } from "react";
import { BikeDetailsSkeleton } from "@/features/customer/vehicles/components/details/bike-details-skeleton";
import { GroupBookingRoute } from "@/features/customer/bookings/components/flow/group-booking-route";

export const metadata: Metadata = { title: "Book" };

export const instant = false;

export default async function BookGroupPage({ params }: { params: Promise<{ groupSlug: string }> }) {
  const { groupSlug } = await params;
  return (
    <Suspense fallback={<BikeDetailsSkeleton />}>
      <GroupBookingRoute groupSlug={groupSlug} />
    </Suspense>
  );
}
