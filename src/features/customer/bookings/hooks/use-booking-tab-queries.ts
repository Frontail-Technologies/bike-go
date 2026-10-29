"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { apiBookingToView } from "../lib/booking-mapper";
import { listBookingsQuery } from "../queries";
import { BOOKING_TABS, type BookingTab } from "./use-booking-tab-params";

const PAGE_SIZE = 12;
const PREFETCH_STALE_MS = 60_000;

const tabQuery = (tab: BookingTab, page: number) => listBookingsQuery({ page, pageSize: PAGE_SIZE, group: tab });

export function useBookingTabList(tab: BookingTab, page: number) {
  const query = useQuery(tabQuery(tab, page));
  const items = useMemo(() => (query.data?.data ?? []).map(apiBookingToView), [query.data]);
  const total = query.data?.meta.total ?? 0;

  return {
    items,
    total,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    isLoaded: query.isSuccess,
    isLoading: query.isPending || query.isPlaceholderData,
  };
}

export function usePrefetchBookingTabs(current: BookingTab, enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    for (const tab of BOOKING_TABS) {
      if (tab !== current) void queryClient.prefetchQuery({ ...tabQuery(tab, 1), staleTime: PREFETCH_STALE_MS });
    }
  }, [current, enabled, queryClient]);
}
