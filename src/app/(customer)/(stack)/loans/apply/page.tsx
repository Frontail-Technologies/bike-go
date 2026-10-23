import type { Metadata } from "next";
import { Suspense } from "react";
import { ApplyFlow } from "@/features/loans/apply-flow";

export const metadata: Metadata = { title: "Loan application" };

export default function ApplyPage() {
  return (
    <Suspense fallback={null}>
      <ApplyFlow />
    </Suspense>
  );
}
