"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { CustomerListParams, CustomerSort, CustomerStatus, JoinedWindow } from "../types/customer";

export const CUSTOMER_PAGE_SIZE = 10;
const sorts: readonly CustomerSort[] = ["newest", "oldest", "name"];
const statuses: readonly CustomerStatus[] = ["active", "inactive"];
const windows: readonly JoinedWindow[] = ["30", "90", "180"];
type Filters = Pick<CustomerListParams, "q" | "status" | "city" | "joined" | "sort">;

const oneOf = <T extends string>(values: readonly T[], value: string | null) => values.find((item) => item === value);

/** The list's whole state lives in the URL, so it survives refresh and back/forward navigation. */
export function useCustomerListState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = useMemo<CustomerListParams>(() => {
    const page = Number.parseInt(searchParams.get("page") ?? "1", 10);
    return {
      page: Number.isFinite(page) && page > 0 ? page : 1,
      pageSize: CUSTOMER_PAGE_SIZE,
      q: searchParams.get("q")?.trim() || undefined,
      status: oneOf(statuses, searchParams.get("status")),
      city: searchParams.get("city") || undefined,
      joined: oneOf(windows, searchParams.get("joined")),
      sort: oneOf(sorts, searchParams.get("sort")),
    };
  }, [searchParams]);

  const write = useCallback((next: Partial<CustomerListParams>) => {
    const merged = { ...params, ...next };
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
    reset: () => write({ q: undefined, status: undefined, city: undefined, joined: undefined, page: 1 }),
  };
}
