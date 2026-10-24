import type { Booking } from "@/features/admin/bookings/types/booking";
import { apiClient } from "@/lib/api/client";
import type { Customer, CustomerDocument, CustomerListMeta, CustomerListParams, CustomerLoan, CustomerSummary, CustomerUpdateInput, PageParams } from "../types/customer";

type Envelope<T> = { data: T; meta: Record<string, unknown> };
const page = async <T>(path: string, params: object) => {
  const response = await apiClient.get<Envelope<T[]>>(path, { params });
  return { data: response.data.data, meta: response.data.meta as CustomerListMeta };
};

export const customersApi = {
  list: (params: CustomerListParams) => page<CustomerSummary>("/admin/customers", params),
  get: (id: string) => apiClient.get<Envelope<Customer>>(`/admin/customers/${id}`).then((response) => response.data.data),
  update: (id: string, input: CustomerUpdateInput) => apiClient.patch<Envelope<Customer>>(`/admin/customers/${id}`, input).then((response) => response.data.data),
  // The shared admin lists, scoped to one customer.
  bookings: (id: string, params: PageParams) => page<Booking>("/admin/bookings", { ...params, customerId: id, sort: "newest" }),
  loans: (id: string, params: PageParams) => page<CustomerLoan>("/admin/loans", { ...params, customerId: id }),
  documents: (id: string, params: PageParams) => page<CustomerDocument>("/admin/documents", { ...params, customerId: id }),
};
