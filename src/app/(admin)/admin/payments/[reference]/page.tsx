import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/feedback";
import { PaymentDetail } from "@/components/admin/payments/payment-detail";

export const instant = false;

async function PaymentWorkspace({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  return <PaymentDetail reference={reference} />;
}

export default function PaymentDetailPage({ params }: { params: Promise<{ reference: string }> }) {
  return <Suspense fallback={<AdminLoadingState label="Loading payment…" />}><PaymentWorkspace params={params} /></Suspense>;
}
