import { Suspense } from "react";
import { DocumentList } from "@/features/admin/documents/components/document-list";
import { AdminLoadingState } from "@/components/admin/feedback";

export const instant = false;

async function DocumentReview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Suspense fallback={<AdminLoadingState labelKey="ui.loadingLabels.documents" />}><DocumentList initialId={id} /></Suspense>;
}

export default function DocumentReviewPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<AdminLoadingState labelKey="ui.loadingLabels.document" />}><DocumentReview params={params} /></Suspense>;
}
