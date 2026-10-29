"use client";

import { oneOf, useListState } from "@/hooks/use-list-state";
import { bookingStatuses, paymentStatuses, type BookingListParams, type BookingSort, type PickupWindow } from "../types/booking";

export const BOOKING_PAGE_SIZE = 10;
const sorts: readonly BookingSort[] = ["newest", "oldest", "pickup_asc", "pickup_desc", "total_asc", "total_desc"];
const windows: readonly PickupWindow[] = ["today", "next7", "last7"];
const read = (search: URLSearchParams): BookingListParams => {
  const overdue = search.get("overdue") === "true";
  return {
    page: Math.max(1, Number.parseInt(search.get("page") ?? "1", 10) || 1), pageSize: BOOKING_PAGE_SIZE,
    q: search.get("q")?.trim() || undefined,
    status: overdue ? undefined : oneOf(bookingStatuses, search.get("status")),
    paymentStatus: oneOf(paymentStatuses, search.get("paymentStatus")),
    locationId: search.get("locationId") || undefined,
    pickup: oneOf(windows, search.get("pickup")),
    overdue: overdue || undefined,
    sort: oneOf(sorts, search.get("sort")),
  };
};
const reset = { q: undefined, status: undefined, paymentStatus: undefined, locationId: undefined, pickup: undefined, overdue: undefined };

export function useBookingListState() {
  return useListState<BookingListParams>({
    read,
    reset,
  });
}
