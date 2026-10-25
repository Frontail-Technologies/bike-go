import type { Metadata } from "next";
import { Suspense } from "react";
import { ApplyFlow } from "@/features/customer/loans/components/apply-flow";
import { CustomerAuthBoundary } from "@/features/customer/auth/components/customer-auth-boundary";

export const metadata: Metadata = { title: "Loan application" };

export default function ApplyPage() {
  return (
    <Suspense fallback={null}>
      <CustomerAuthBoundary><ApplyFlow /></CustomerAuthBoundary>
    </Suspense>
  );
}
