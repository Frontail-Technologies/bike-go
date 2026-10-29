"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { supportTicketCategories, supportTicketStatuses, type SupportTicketListParams, type SupportTicketSort } from "../types/feedback";

export const FEEDBACK_PAGE_SIZE = 10;
const sorts: readonly SupportTicketSort[] = ["newest", "oldest"];
type Filters = Pick<SupportTicketListParams, "q" | "status" | "category" | "sort">;

const oneOf = <T extends string>(values: readonly T[], value: string | null) => values.find((item) => item === value);

export function useFeedbackListState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = useMemo<SupportTicketListParams>(() => {
    const page = Number.parseInt(searchParams.get("page") ?? "1", 10);
    return {
      page: Number.isFinite(page) && page > 0 ? page : 1,
      pageSize: FEEDBACK_PAGE_SIZE,
      q: searchParams.get("q")?.trim() || undefined,
      status: oneOf(supportTicketStatuses, searchParams.get("status")),
      category: oneOf(supportTicketCategories, searchParams.get("category")),
      sort: oneOf(sorts, searchParams.get("sort")),
    };
  }, [searchParams]);

  const write = useCallback((next: Partial<SupportTicketListParams>) => {
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
    setFilters: (filters: Partial<Filters>) => write({ ...filters, page: 1 }),
    reset: () => write({ q: undefined, status: undefined, category: undefined, sort: undefined, page: 1 }),
  };
}
