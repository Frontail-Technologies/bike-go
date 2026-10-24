import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/feedback";
import { PaymentList } from "@/features/admin/payments/components/payment-list";

export default function PaymentsPage() {
  return <Suspense fallback={<AdminLoadingState label="Loading payments…" />}><PaymentList /></Suspense>;
}
