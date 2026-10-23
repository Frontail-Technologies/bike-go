import { CustomerDetailScreen } from "@/components/admin/operations/operation-screens";
import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/feedback";

async function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerDetailScreen id={id} />;
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<AdminLoadingState label="Loading customer…" />}><CustomerDetail params={params} /></Suspense>;
}
