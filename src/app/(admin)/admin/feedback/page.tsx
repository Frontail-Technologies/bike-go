import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/feedback";
import { FeedbackList } from "@/features/admin/feedback/components/feedback-list";

export default function FeedbackPage() {
  return <Suspense fallback={<AdminLoadingState label="Loading feedback…" />}><FeedbackList /></Suspense>;
}
