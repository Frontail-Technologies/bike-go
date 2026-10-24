"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminCustomerQueryKeys } from "@/features/admin/customers/query-keys";
import { adminLoanQueryKeys } from "@/features/admin/loans/query-keys";
import { documentsApi } from "../api/documents-api";
import { adminDocumentQueryKeys } from "../query-keys";
import type { DocumentDecision, DocumentListParams } from "../types/document";

export function useDocumentsQuery(params: DocumentListParams) {
  return useQuery({ queryKey: adminDocumentQueryKeys.list(params), queryFn: () => documentsApi.list(params), placeholderData: keepPreviousData });
}

export function useDocumentStatsQuery() {
  return useQuery({ queryKey: adminDocumentQueryKeys.stats(), queryFn: documentsApi.stats, staleTime: 15_000 });
}

export function useDocumentQuery(id: string | null) {
  return useQuery({ queryKey: adminDocumentQueryKeys.detail(id ?? ""), queryFn: () => documentsApi.get(id as string), enabled: Boolean(id) });
}

export function useDocumentReview() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ loanReference, documentId, verificationStatus, note }: { loanReference: string; documentId: string; verificationStatus: DocumentDecision; note?: string }) =>
      documentsApi.review(loanReference, documentId, { verificationStatus, ...(note ? { note } : {}) }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: adminDocumentQueryKeys.root() });
      void client.invalidateQueries({ queryKey: adminLoanQueryKeys.root() });
      void client.invalidateQueries({ queryKey: adminCustomerQueryKeys.root() });
    },
  });
}
