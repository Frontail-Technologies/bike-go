import { apiClient } from "@/lib/api/client";
import type { ApiEnvelope as Envelope } from "@/lib/api/contracts";
import type { DocumentListMeta, DocumentListParams, DocumentReviewInput, DocumentStats, ReviewDocument, ReviewDocumentDetail } from "../types/document";

const DAY = 86_400_000;

function toQuery({ uploaded, ...params }: DocumentListParams) {
  return { ...params, ...(uploaded ? { from: new Date(Date.now() - Number(uploaded) * DAY).toISOString() } : {}) };
}

export const documentFileUrl = (path: string) => new URL(path, apiClient.defaults.baseURL).toString();

export const documentsApi = {
  list: async (params: DocumentListParams) => {
    const response = await apiClient.get<Envelope<ReviewDocument[]>>("/admin/documents", { params: toQuery(params) });
    return { data: response.data.data, meta: response.data.meta as DocumentListMeta };
  },
  stats: () => apiClient.get<Envelope<DocumentStats>>("/admin/documents/stats").then((response) => response.data.data),
  get: (id: string) => apiClient.get<Envelope<ReviewDocumentDetail>>(`/admin/documents/${id}`).then((response) => response.data.data),
  review: (loanReference: string, documentId: string, input: DocumentReviewInput) => apiClient.patch(`/admin/loans/${loanReference}/documents/${documentId}/review`, input).then((response) => response.data),
};
