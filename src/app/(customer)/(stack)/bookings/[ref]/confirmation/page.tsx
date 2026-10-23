import type { Metadata } from "next";
import { Suspense } from "react";
import { seedBookings } from "@/features/bookings/seed";
import { BlockSkeleton } from "@/components/ui/skeleton";
import { ConfirmationView } from "@/features/bookings/confirmation-view";

export const metadata: Metadata = { title: "Booking confirmed" };

export function generateStaticParams() {
  return seedBookings.map((booking) => ({ ref: booking.reference }));
}

export default function ConfirmationPage({ params }: { params: Promise<{ ref: string }> }) {
  return (
    <Suspense fallback={<BlockSkeleton className="mx-auto h-96 w-full max-w-xl" />}>
      {params.then(({ ref }) => (
        <ConfirmationView reference={ref} />
      ))}
    </Suspense>
  );
}
