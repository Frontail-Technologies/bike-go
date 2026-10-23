import { BookingDetailScreen } from "@/components/admin/operations/operation-screens";
import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/feedback";

async function BookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BookingDetailScreen id={id} />;
}

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<AdminLoadingState label="Loading booking…" />}><BookingDetail params={params} /></Suspense>;
}
