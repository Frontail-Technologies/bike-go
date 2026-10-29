"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useCustomerSessionQuery } from "@/features/customer/auth/hooks/use-customer-session-query";
import { listBookingsQuery } from "@/features/customer/bookings/queries";
import type { ApiBookingStatus } from "@/features/customer/bookings/types";
import { profileStore } from "@/features/customer/profile/stores/preferences-store";
import { showBrowserNotification } from "../lib/browser-notifications";

const labels: Record<ApiBookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  ready_for_pickup: "Ready for pickup",
  active: "On rent",
  returned: "Returned",
  completed: "Completed",
  cancelled: "Cancelled",
  expired: "Expired",
  no_show: "No show",
};

const WATCH_PARAMS = { page: 1, pageSize: 100 } as const;

/**
 * While the customer has booking updates turned on, polls their bookings and shows a browser
 * notification whenever one changes status. Shares its cache entry with the notifications page.
 */
export function useBookingStatusNotifications() {
  const session = useCustomerSessionQuery();
  const preferences = profileStore.useValue().notifications;
  const previous = useRef<Map<string, ApiBookingStatus> | null>(null);
  const bookings = useQuery({
    ...listBookingsQuery(WATCH_PARAMS),
    enabled: Boolean(session.data && preferences.updates),
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!bookings.data) return;
    const next = new Map(bookings.data.data.map((booking) => [booking.reference, booking.bookingStatus]));
    if (previous.current && preferences.updates) {
      for (const booking of bookings.data.data) {
        const before = previous.current.get(booking.reference);
        if (before && before !== booking.bookingStatus) {
          void showBrowserNotification(`Booking ${labels[booking.bookingStatus]}`, {
            body: `${booking.vehicle.name} · ${booking.reference}`,
            tag: `booking-${booking.reference}`,
            data: { url: `/bookings/${booking.reference}` },
          });
        }
      }
    }
    previous.current = next;
  }, [bookings.data, preferences.updates]);
}
