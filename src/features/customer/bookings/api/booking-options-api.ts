import { apiClient } from "@/lib/api/client";
import { unwrapData, type ApiEnvelope } from "@/lib/api/contracts";
import type { BookingOption } from "../types";

export async function listBookingOptions(signal?: AbortSignal): Promise<BookingOption[]> {
  const response = await apiClient.request<ApiEnvelope<BookingOption[]>>({ method: "GET", url: "/bookings/options", params: { limit: 50 }, signal });
  return unwrapData(response.data);
}
