import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/feedback";
import { FeedbackDetail } from "@/features/admin/feedback/components/feedback-detail";

export const instant = false;

async function FeedbackWorkspace({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  return <FeedbackDetail reference={reference} />;
}

export default function FeedbackDetailPage({ params }: { params: Promise<{ reference: string }> }) {
  return <Suspense fallback={<AdminLoadingState labelKey="ui.loadingLabels.ticket" />}><FeedbackWorkspace params={params} /></Suspense>;
}
