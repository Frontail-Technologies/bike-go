"use client";

import { documentTypes, verificationStatuses } from "@/features/admin/loans/types/loan";
import { oneOf, useListState } from "@/hooks/use-list-state";
import type { DocumentListParams, DocumentSort, UploadedWindow } from "../types/document";

export const DOCUMENT_PAGE_SIZE = 10;
const sorts: readonly DocumentSort[] = ["newest", "oldest"];
const windows: readonly UploadedWindow[] = ["7", "30", "90"];
const read = (search: URLSearchParams): DocumentListParams => ({
  page: Math.max(1, Number.parseInt(search.get("page") ?? "1", 10) || 1), pageSize: DOCUMENT_PAGE_SIZE,
  q: search.get("q")?.trim() || undefined, status: oneOf(verificationStatuses, search.get("status")),
  type: oneOf(documentTypes, search.get("type")), uploaded: oneOf(windows, search.get("uploaded")), sort: oneOf(sorts, search.get("sort")),
});
const reset = { q: undefined, status: undefined, type: undefined, uploaded: undefined };

export function useDocumentListState() {
  return useListState<DocumentListParams>({
    pathname: "/admin/documents",
    read,
    reset,
  });
}
