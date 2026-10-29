import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/feedback";
import { DocumentList } from "@/features/admin/documents/components/document-list";

export default function DocumentsPage() {
  return <Suspense fallback={<AdminLoadingState labelKey="ui.loadingLabels.documents" />}><DocumentList /></Suspense>;
}
