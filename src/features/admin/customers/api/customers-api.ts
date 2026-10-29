import type { Booking } from "@/features/admin/bookings/types/booking";
import { apiClient } from "@/lib/api/client";
import type { ApiEnvelope as Envelope } from "@/lib/api/contracts";
import type { Customer, CustomerActivity, CustomerDocument, CustomerListMeta, CustomerListParams, CustomerLoan, CustomerStats, CustomerSummary, CustomerUpdateInput, JoinedWindow, PageParams } from "../types/customer";

const page = async <T>(path: string, params: object) => {
  const response = await apiClient.get<Envelope<T[]>>(path, { params });
  return { data: response.data.data, meta: response.data.meta as CustomerListMeta };
};

const DAY = 86_400_000;
const joinedFrom = (window: JoinedWindow, now = Date.now()) => new Date(now - Number(window) * DAY).toISOString();

function toQuery({ joined, ...params }: CustomerListParams) {
  return { ...params, ...(joined ? { joinedFrom: joinedFrom(joined) } : {}) };
}

export const customersApi = {
  list: (params: CustomerListParams) => page<CustomerSummary>("/admin/customers", toQuery(params)),
  stats: () => apiClient.get<Envelope<CustomerStats>>("/admin/customers/stats").then((response) => response.data.data),
  get: (id: string) => apiClient.get<Envelope<Customer>>(`/admin/customers/${id}`).then((response) => response.data.data),
  update: (id: string, input: CustomerUpdateInput) => apiClient.patch<Envelope<Customer>>(`/admin/customers/${id}`, input).then((response) => response.data.data),
  activity: (id: string, params: PageParams) => page<CustomerActivity>(`/admin/customers/${id}/activity`, params),
  bookings: (id: string, params: PageParams) => page<Booking>("/admin/bookings", { ...params, customerId: id, sort: "newest" }),
  loans: (id: string, params: PageParams) => page<CustomerLoan>("/admin/loans", { ...params, customerId: id }),
  documents: (id: string, params: PageParams) => page<CustomerDocument>("/admin/documents", { ...params, customerId: id })
};
