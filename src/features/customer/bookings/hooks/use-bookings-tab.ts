"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { apiBookingToView } from "../lib/booking-mapper";
import { listBookingsQuery } from "../queries";
import { useBookingsQuery } from "./use-bookings";

export const BOOKING_TABS = [
  { id: "upcoming", label: "tabUpcoming", empty: "emptyUpcoming" },
  { id: "active", label: "tabActive", empty: "emptyActive" },
  { id: "completed", label: "tabCompleted", empty: "emptyCompleted" },
  { id: "cancelled", label: "tabCancelled", empty: "emptyCancelled" },
] as const;

export type BookingTab = (typeof BOOKING_TABS)[number];
type TabId = BookingTab["id"];

const PAGE_SIZE = 12;
const isTab = (value: string | null): value is TabId => BOOKING_TABS.some((tab) => tab.id === value);
const paramsFor = (group: TabId, page: number) => ({ page, pageSize: PAGE_SIZE, group });

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
  const selected: TabId = isTab(tabParam) ? tabParam : "upcoming";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const query = useBookingsQuery(paramsFor(selected, page));

  useEffect(() => {
    if (!query.isSuccess) return;
    for (const tab of BOOKING_TABS) {
      if (tab.id === selected) continue;
      void queryClient.prefetchQuery(listBookingsQuery(paramsFor(tab.id, 1)));
    }
  }, [query.isSuccess, queryClient, selected]);

  const items = useMemo(() => (query.data?.data ?? []).map(apiBookingToView), [query.data]);
  const total = query.data?.meta.total ?? 0;

  function navigate(tab: TabId, nextPage = 1) {
    const next = new URLSearchParams(searchParams.toString());
    if (tab === "upcoming") next.delete("tab"); else next.set("tab", tab);
    if (nextPage <= 1) next.delete("page"); else next.set("page", String(nextPage));
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  }

  return {
    tabs: BOOKING_TABS,
    selected: BOOKING_TABS.find((tab) => tab.id === selected)!,
    selectTab: (tab: TabId) => navigate(tab),
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
