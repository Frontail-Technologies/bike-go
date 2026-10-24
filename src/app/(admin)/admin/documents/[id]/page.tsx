import { Suspense } from "react";
import { DocumentList } from "@/components/admin/documents/document-list";
import { AdminLoadingState } from "@/components/admin/feedback";

export const instant = false;

async function DocumentReview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DocumentList initialId={id} />;
}

export default function DocumentReviewPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<AdminLoadingState label="Loading document…" />}><DocumentReview params={params} /></Suspense>;
}
