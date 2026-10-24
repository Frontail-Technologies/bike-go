"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { CustomerListParams, CustomerSort } from "../types/customer";

export const CUSTOMER_PAGE_SIZE = 10;
const sorts: readonly CustomerSort[] = ["newest", "oldest", "name"];

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
      sort: sorts.find((item) => item === searchParams.get("sort")),
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
    /** Changing the search or the sort returns to the first page. */
    setFilters: (filters: Partial<Pick<CustomerListParams, "q" | "sort">>) => write({ ...filters, page: 1 }),
    reset: () => write({ q: undefined, page: 1 }),
  };
}
