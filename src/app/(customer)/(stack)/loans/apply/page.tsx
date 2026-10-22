import type { Metadata } from "next";
import { Suspense } from "react";
import { ApplyFlow } from "@/features/loans/apply-flow";

export const metadata: Metadata = { title: "Loan application" };

// The flow reads ?step= and prefill values from the URL, so it renders under Suspense.
export default function ApplyPage() {
  return (
    <Suspense fallback={null}>
      <ApplyFlow />
    </Suspense>
  );
}
