import { Suspense } from "react";
import { BookingDetail } from "@/features/admin/bookings/components/booking-detail";
import { AdminLoadingState } from "@/components/admin/feedback";

export const instant = false;

async function BookingWorkspace({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  return <BookingDetail reference={reference} />;
}

export default function BookingDetailPage({ params }: { params: Promise<{ reference: string }> }) {
  return <Suspense fallback={<AdminLoadingState label="Loading booking…" />}><BookingWorkspace params={params} /></Suspense>;
}
