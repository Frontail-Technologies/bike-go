import { LoadingRegion } from "@/components/ui/loading-region";
import type { Metadata } from "next";
import { Suspense } from "react";
import { BlockSkeleton } from "@/components/ui/skeleton";
import { BookingDetailsView } from "@/features/customer/bookings/components/booking-details-view";
import { CustomerAuthBoundary } from "@/features/customer/auth/components/customer-auth-boundary";

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

export const instant = false;

export default function BookingPage({ params }: { params: Promise<{ ref: string }> }) {
  return (
    <Suspense fallback={<DetailsSkeleton />}>
      {params.then(({ ref }) => (
        <CustomerAuthBoundary><BookingDetailsView reference={ref} /></CustomerAuthBoundary>
      ))}
    </Suspense>
  );
}
