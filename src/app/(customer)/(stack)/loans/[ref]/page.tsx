import type { Metadata } from "next";
import { Suspense } from "react";
import { BlockSkeleton } from "@/components/ui/skeleton";
import { seedApplications } from "@/features/loans/data";
import { LoanStatusView } from "@/features/loans/status-view";

export const metadata: Metadata = { title: "Application status" };

function StatusSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4" role="status" aria-label="Loading application">
      <BlockSkeleton className="h-8 w-48" />
      <BlockSkeleton className="h-40 w-full" />
      <BlockSkeleton className="h-56 w-full" />
    </div>
  );
}

// Applications are created at runtime, so the reference is runtime data: read it under Suspense.
// Sample references let the shell's pathname-aware nav prerender.
export function generateStaticParams() {
  return seedApplications.map((application) => ({ ref: application.reference }));
}

export default function LoanStatusPage({ params }: { params: Promise<{ ref: string }> }) {
  return (
    <Suspense fallback={<StatusSkeleton />}>
      {params.then(({ ref }) => (
        <LoanStatusView reference={ref} />
      ))}
    </Suspense>
  );
}
