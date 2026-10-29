"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { apiBookingToView } from "../lib/booking-mapper";
import { listBookingsQuery } from "../queries";
import { BOOKING_TABS, type BookingTab } from "./use-booking-tab-params";

const PAGE_SIZE = 12;
// Prefetched tabs count as fresh for a minute, so flipping between tabs doesn't refetch the others each time.
const PREFETCH_STALE_MS = 60_000;

const tabQuery = (tab: BookingTab, page: number) => listBookingsQuery({ page, pageSize: PAGE_SIZE, group: tab });

/** One tab's page of bookings, ordered by pickup on the server, mapped for the cards. */
export function useBookingTabList(tab: BookingTab, page: number) {
  const query = useQuery(tabQuery(tab, page));
  const items = useMemo(() => (query.data?.data ?? []).map(apiBookingToView), [query.data]);
  const total = query.data?.meta.total ?? 0;

  return {
    items,
    total,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    isLoaded: query.isSuccess,
    // The list query keeps the previous result as a placeholder; here that's another tab's or page's
    // bookings, so treat it as loading.
    isLoading: query.isPending || query.isPlaceholderData,
  };
}

/** Once the open tab has loaded, loads the first page of the other tabs so switching to them is instant. */
export function usePrefetchBookingTabs(current: BookingTab, enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    for (const tab of BOOKING_TABS) {
      if (tab !== current) void queryClient.prefetchQuery({ ...tabQuery(tab, 1), staleTime: PREFETCH_STALE_MS });
    }
  }, [current, enabled, queryClient]);
}
