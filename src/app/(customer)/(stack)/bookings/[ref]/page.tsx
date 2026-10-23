import { LoadingRegion } from "@/components/ui/loading-region";
import type { Metadata } from "next";
import { Suspense } from "react";
import { seedBookings } from "@/features/bookings/seed";
import { BlockSkeleton } from "@/components/ui/skeleton";
import { BookingDetailsView } from "@/features/bookings/booking-details-view";

export const metadata: Metadata = { title: "Booking details" };

function DetailsSkeleton() {
  return (
    <LoadingRegion className="flex flex-col gap-4">
      <BlockSkeleton className="h-8 w-48" />
      <BlockSkeleton className="h-40 w-full" />
      <BlockSkeleton className="h-56 w-full" />
    </LoadingRegion>
  );
}

export function generateStaticParams() {
  return seedBookings.map((booking) => ({ ref: booking.reference }));
}

export default function BookingPage({ params }: { params: Promise<{ ref: string }> }) {
  return (
    <Suspense fallback={<DetailsSkeleton />}>
      {params.then(({ ref }) => (
        <BookingDetailsView reference={ref} />
      ))}
    </Suspense>
  );
}
