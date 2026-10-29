"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { apiBookingToView } from "../lib/booking-mapper";
import { listBookingsQuery } from "../queries";
import { useBookingsQuery } from "./use-bookings";

export const BOOKING_TABS = ["upcoming", "active", "completed", "cancelled"] as const;
export type BookingTab = (typeof BOOKING_TABS)[number];

const PAGE_SIZE = 12;
// Prefetched tabs count as fresh for a minute, so flipping between tabs doesn't refetch the others each time.
const PREFETCH_STALE_MS = 60_000;
const isTab = (value: string | null): value is BookingTab => BOOKING_TABS.some((tab) => tab === value);
const paramsFor = (group: BookingTab, page: number) => ({ page, pageSize: PAGE_SIZE, group });

/**
 * "My bookings": the tab and page live in the URL (so refresh and back/forward keep them), the server
 * orders each tab by pickup, and the other tabs are prefetched so switching to them is instant.
 */
export function useBookingsTab() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const tabParam = searchParams.get("tab");
  const selected: BookingTab = isTab(tabParam) ? tabParam : "upcoming";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const query = useBookingsQuery(paramsFor(selected, page));

  useEffect(() => {
    if (!query.isSuccess) return;
    for (const tab of BOOKING_TABS) {
      if (tab === selected) continue;
      void queryClient.prefetchQuery({ ...listBookingsQuery(paramsFor(tab, 1)), staleTime: PREFETCH_STALE_MS });
    }
  }, [query.isSuccess, queryClient, selected]);

  const items = useMemo(() => (query.data?.data ?? []).map(apiBookingToView), [query.data]);
  const total = query.data?.meta.total ?? 0;

  function navigate(tab: BookingTab, nextPage = 1) {
    const next = new URLSearchParams(searchParams.toString());
    if (tab === "upcoming") next.delete("tab"); else next.set("tab", tab);
    if (nextPage <= 1) next.delete("page"); else next.set("page", String(nextPage));
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  }

  return {
    selected,
    selectTab: (tab: BookingTab) => navigate(tab),
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    goToPage: (next: number) => navigate(selected, next),
    total,
    items,
    // The generated query keeps the previous result as a placeholder; here that would be another
    // tab's (or page's) bookings, so treat it as loading. Prefetching makes tab switches instant anyway.
    isLoading: query.isPending || query.isPlaceholderData,
  };
}
