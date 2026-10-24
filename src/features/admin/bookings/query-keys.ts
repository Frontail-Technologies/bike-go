import type { BookingListParams } from "./types/booking";

/** Query identities local to the bookings feature. */
export const adminBookingQueryKeys = {
  root: () => ["admin", "bookings"] as const,
  list: (params: BookingListParams) => ["admin", "bookings", "list", params] as const,
  detail: (reference: string) => ["admin", "bookings", "detail", reference] as const,
} as const;
