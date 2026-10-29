"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const BOOKING_TABS = ["upcoming", "active", "completed", "cancelled"] as const;
export type BookingTab = (typeof BOOKING_TABS)[number];

const isTab = (value: string | null): value is BookingTab => BOOKING_TABS.some((tab) => tab === value);

/** Which "my bookings" tab and page are open. Kept in the URL so refresh and back/forward preserve them. */
export function useBookingTabParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const selected: BookingTab = isTab(tabParam) ? tabParam : "upcoming";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  function navigate(tab: BookingTab, nextPage = 1) {
    const next = new URLSearchParams(searchParams.toString());
    if (tab === "upcoming") next.delete("tab"); else next.set("tab", tab);
    if (nextPage <= 1) next.delete("page"); else next.set("page", String(nextPage));
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  }

  return {
    selected,
    page,
    selectTab: (tab: BookingTab) => navigate(tab),
    goToPage: (next: number) => navigate(selected, next),
  };
}
