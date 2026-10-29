"use client";

import { oneOf, useListState } from "@/hooks/use-list-state";
import type { CustomerListParams, CustomerSort, CustomerStatus, JoinedWindow } from "../types/customer";

export const CUSTOMER_PAGE_SIZE = 10;
const sorts: readonly CustomerSort[] = ["newest", "oldest", "name"];
const statuses: readonly CustomerStatus[] = ["active", "inactive"];
const windows: readonly JoinedWindow[] = ["30", "90", "180"];
const read = (search: URLSearchParams): CustomerListParams => ({
  page: Math.max(1, Number.parseInt(search.get("page") ?? "1", 10) || 1), pageSize: CUSTOMER_PAGE_SIZE,
  q: search.get("q")?.trim() || undefined,
  status: oneOf(statuses, search.get("status")), city: search.get("city") || undefined,
  joined: oneOf(windows, search.get("joined")), sort: oneOf(sorts, search.get("sort")),
});
const reset = { q: undefined, status: undefined, city: undefined, joined: undefined };

export function useCustomerListState() {
  return useListState<CustomerListParams>({
    read,
    reset,
  });
}
