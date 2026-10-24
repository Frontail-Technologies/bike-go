import { CustomerDetail as CustomerWorkspace } from "@/components/admin/customers/customer-detail";
import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/feedback";

export const instant = false;

async function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerWorkspace id={id} />;
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<AdminLoadingState label="Loading customer…" />}><CustomerDetail params={params} /></Suspense>;
}
