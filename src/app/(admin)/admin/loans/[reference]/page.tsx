import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/feedback";
import { LoanDetail } from "@/components/admin/loans/loan-detail";

export const instant = false;

async function LoanWorkspace({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  return <LoanDetail reference={reference} />;
}

export default function LoanDetailPage({ params }: { params: Promise<{ reference: string }> }) {
  return <Suspense fallback={<AdminLoadingState label="Loading application…" />}><LoanWorkspace params={params} /></Suspense>;
}
