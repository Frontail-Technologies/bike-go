"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { bookingStatuses, paymentStatuses, type BookingListParams, type BookingSort, type PickupWindow } from "../types/booking";

export const BOOKING_PAGE_SIZE = 10;
const sorts: readonly BookingSort[] = ["newest", "oldest", "pickup_asc", "pickup_desc", "total_asc", "total_desc"];
const windows: readonly PickupWindow[] = ["today", "next7", "last7"];
type Filters = Pick<BookingListParams, "q" | "status" | "paymentStatus" | "locationId" | "pickup" | "overdue" | "sort">;

const oneOf = <T extends string>(values: readonly T[], value: string | null) => values.find((item) => item === value);

/** The list's whole state lives in the URL, so it survives refresh and back/forward navigation. */
export function useBookingListState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = useMemo<BookingListParams>(() => {
    const page = Number.parseInt(searchParams.get("page") ?? "1", 10);
    const overdue = searchParams.get("overdue") === "true";
    return {
      page: Number.isFinite(page) && page > 0 ? page : 1,
      pageSize: BOOKING_PAGE_SIZE,
      q: searchParams.get("q")?.trim() || undefined,
      // Overdue is an active rental past its return time, so it replaces any status filter.
      status: overdue ? undefined : oneOf(bookingStatuses, searchParams.get("status")),
      paymentStatus: oneOf(paymentStatuses, searchParams.get("paymentStatus")),
      locationId: searchParams.get("locationId") || undefined,
      pickup: oneOf(windows, searchParams.get("pickup")),
      overdue: overdue || undefined,
      sort: oneOf(sorts, searchParams.get("sort")),
    };
  }, [searchParams]);

  const write = useCallback((next: Partial<BookingListParams>) => {
    const merged: BookingListParams = { ...params, ...next };
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (key === "pageSize" || value === undefined || value === "" || (key === "page" && value === 1)) continue;
      query.set(key, String(value));
    }
    const search = query.toString();
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
  }, [params, pathname, router]);

  return {
    params,
    setPage: (page: number) => write({ page }),
    /** Changing any filter or the sort returns to the first page. */
    setFilters: (filters: Partial<Filters>) => write({ ...filters, page: 1 }),
    reset: () => write({ q: undefined, status: undefined, paymentStatus: undefined, locationId: undefined, pickup: undefined, overdue: undefined, page: 1 }),
  };
}
