import { LoanDetailScreen } from "@/components/admin/operations/operation-screens";
import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/feedback";

async function LoanDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LoanDetailScreen id={id} />;
}

export default function LoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<AdminLoadingState label="Loading loan application…" />}><LoanDetail params={params} /></Suspense>;
}
