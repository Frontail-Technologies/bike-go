import { LoadingRegion } from "@/components/ui/loading-region";
import type { Metadata } from "next";
import { Suspense } from "react";
import { BlockSkeleton } from "@/components/ui/skeleton";
import { LoanStatusView } from "@/features/loans/status-view";

export const metadata: Metadata = { title: "Application status" };

function StatusSkeleton() {
  return (
    <LoadingRegion className="flex flex-col gap-4 p-4">
      <BlockSkeleton className="h-8 w-48" />
      <BlockSkeleton className="h-40 w-full" />
      <BlockSkeleton className="h-56 w-full" />
    </LoadingRegion>
  );
}

export const instant = false;

export default function LoanStatusPage({ params }: { params: Promise<{ ref: string }> }) {
  return (
    <Suspense fallback={<StatusSkeleton />}>
      {params.then(({ ref }) => (
        <LoanStatusView reference={ref} />
      ))}
    </Suspense>
  );
}
