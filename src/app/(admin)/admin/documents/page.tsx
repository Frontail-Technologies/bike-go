import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/feedback";
import { DocumentList } from "@/features/admin/documents/components/document-list";

export default function DocumentsPage() {
  return <Suspense fallback={<AdminLoadingState label="Loading documents…" />}><DocumentList /></Suspense>;
}
