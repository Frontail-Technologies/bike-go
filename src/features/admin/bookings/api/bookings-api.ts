import { apiClient } from "@/lib/api/client";
import type { ApiEnvelope as Envelope } from "@/lib/api/contracts";
import type { Booking, BookingListMeta, BookingListParams, BookingStatusInput, HandoverInput, ReturnInput } from "../types/booking";

const data = <T>(response: { data: Envelope<T> }) => response.data.data;

function toQuery({ pickup, overdue, ...params }: BookingListParams) {
  return { ...params, ...(overdue ? { overdue: true } : {}), ...(pickup ? { pickup } : {}) };
}

export const bookingsApi = {
  list: async (params: BookingListParams) => {
    const response = await apiClient.get<Envelope<Booking[]>>("/admin/bookings", { params: toQuery(params) });
    return { data: response.data.data, meta: response.data.meta as BookingListMeta };
  },
  get: (reference: string) => apiClient.get<Envelope<Booking>>(`/admin/bookings/${reference}`).then(data),
  updateStatus: (reference: string, input: BookingStatusInput) => apiClient.patch<Envelope<Booking>>(`/admin/bookings/${reference}/status`, input).then(data),
  handover: (reference: string, input: HandoverInput) => apiClient.post<Envelope<Booking>>(`/admin/bookings/${reference}/handover`, input).then(data),
  returnVehicle: (reference: string, input: ReturnInput) => apiClient.post<Envelope<Booking>>(`/admin/bookings/${reference}/return`, input).then(data),
};
