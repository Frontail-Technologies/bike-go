import type { Metadata } from "next";
import { Suspense } from "react";
import { BlockSkeleton } from "@/components/ui/skeleton";
import { ConfirmationView } from "@/features/bookings/confirmation-view";
import { CustomerAuthBoundary } from "@/features/auth/customer-auth-boundary";

export const metadata: Metadata = { title: "Booking confirmed" };

export const instant = false;

export default function ConfirmationPage({ params }: { params: Promise<{ ref: string }> }) {
  return (
    <Suspense fallback={<BlockSkeleton className="mx-auto h-96 w-full max-w-xl" />}>
      {params.then(({ ref }) => (
        <CustomerAuthBoundary><ConfirmationView reference={ref} /></CustomerAuthBoundary>
      ))}
    </Suspense>
  );
}
