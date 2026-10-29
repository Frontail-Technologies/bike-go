import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/feedback";
import { PaymentDetail } from "@/features/admin/payments/components/payment-detail";

export const instant = false;

async function PaymentWorkspace({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  return <PaymentDetail transactionId={decodeURIComponent(reference)} />;
}

export default function PaymentDetailPage({ params }: { params: Promise<{ reference: string }> }) {
  return <Suspense fallback={<AdminLoadingState labelKey="ui.loadingLabels.payment" />}><PaymentWorkspace params={params} /></Suspense>;
}
