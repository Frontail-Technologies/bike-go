import { apiClient } from "@/lib/api/client";
import type { DocumentListMeta, DocumentListParams, DocumentReviewInput, DocumentStats, ReviewDocument, ReviewDocumentDetail } from "../types/document";

type Envelope<T> = { data: T; meta: Record<string, unknown> };
const DAY = 86_400_000;

/** Upload presets are rolling windows, resolved when the request is sent so they never go stale. */
function toQuery({ uploaded, ...params }: DocumentListParams) {
  return { ...params, ...(uploaded ? { from: new Date(Date.now() - Number(uploaded) * DAY).toISOString() } : {}) };
}

/** Where the browser can open a staff-only document: a private, authorised download, never a storage path. */
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
