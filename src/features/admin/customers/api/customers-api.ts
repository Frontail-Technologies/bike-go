import type { Booking } from "@/features/admin/bookings/types/booking";
import { apiClient } from "@/lib/api/client";
import type { Customer, CustomerActivity, CustomerDocument, CustomerListMeta, CustomerListParams, CustomerLoan, CustomerStats, CustomerSummary, CustomerUpdateInput, DocumentReviewInput, JoinedWindow, PageParams } from "../types/customer";

type Envelope<T> = { data: T; meta: Record<string, unknown> };
const page = async <T>(path: string, params: object) => {
  const response = await apiClient.get<Envelope<T[]>>(path, { params });
  return { data: response.data.data, meta: response.data.meta as CustomerListMeta };
};

const DAY = 86_400_000;
/** Joined presets are rolling windows, resolved when the request is sent so they never go stale. */
const joinedFrom = (window: JoinedWindow, now = Date.now()) => new Date(now - Number(window) * DAY).toISOString();

function toQuery({ joined, ...params }: CustomerListParams) {
  return { ...params, ...(joined ? { joinedFrom: joinedFrom(joined) } : {}) };
}

/** Where the browser can open a staff-only document download. */
export const documentDownloadUrl = (fileUrl: string) => new URL(fileUrl, apiClient.defaults.baseURL).toString();

export const customersApi = {
  list: (params: CustomerListParams) => page<CustomerSummary>("/admin/customers", toQuery(params)),
  stats: () => apiClient.get<Envelope<CustomerStats>>("/admin/customers/stats").then((response) => response.data.data),
  get: (id: string) => apiClient.get<Envelope<Customer>>(`/admin/customers/${id}`).then((response) => response.data.data),
  update: (id: string, input: CustomerUpdateInput) => apiClient.patch<Envelope<Customer>>(`/admin/customers/${id}`, input).then((response) => response.data.data),
  activity: (id: string, params: PageParams) => page<CustomerActivity>(`/admin/customers/${id}/activity`, params),
  // The shared admin lists, scoped to one customer.
  bookings: (id: string, params: PageParams) => page<Booking>("/admin/bookings", { ...params, customerId: id, sort: "newest" }),
  loans: (id: string, params: PageParams) => page<CustomerLoan>("/admin/loans", { ...params, customerId: id }),
  documents: (id: string, params: PageParams) => page<CustomerDocument>("/admin/documents", { ...params, customerId: id }),
  reviewDocument: (loanReference: string, documentId: string, input: DocumentReviewInput) => apiClient.patch(`/admin/loans/${loanReference}/documents/${documentId}/review`, input).then((response) => response.data),
};
