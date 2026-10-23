import { DocumentDetailScreen } from "@/components/admin/operations/operation-screens";
import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/feedback";

async function DocumentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DocumentDetailScreen id={id} />;
}

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<AdminLoadingState label="Loading document…" />}><DocumentDetail params={params} /></Suspense>;
}
