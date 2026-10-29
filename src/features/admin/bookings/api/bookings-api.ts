import { apiClient } from "@/lib/api/client";
import type { Booking, BookingListMeta, BookingListParams, BookingStatusInput, HandoverInput, PickupWindow, ReturnInput } from "../types/booking";

type Envelope<T> = { data: T; meta: Record<string, unknown> };
const data = <T>(response: { data: Envelope<T> }) => response.data.data;

const DAY = 86_400_000;
const ICT_OFFSET = 7 * 3_600_000;

function pickupRange(window: PickupWindow, now = Date.now()) {
  const startOfToday = Math.floor((now + ICT_OFFSET) / DAY) * DAY - ICT_OFFSET;
  const range = { today: [startOfToday, startOfToday + DAY], next7: [startOfToday, startOfToday + 7 * DAY], last7: [startOfToday - 7 * DAY, startOfToday] }[window];
  return { pickupFrom: new Date(range[0]).toISOString(), pickupTo: new Date(range[1]).toISOString() };
}

function toQuery({ pickup, overdue, ...params }: BookingListParams) {
  return { ...params, ...(overdue ? { overdue: true } : {}), ...(pickup ? pickupRange(pickup) : {}) };
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
