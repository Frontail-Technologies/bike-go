"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { loanStatuses, loanTypes, type LoanListParams, type LoanSort, type SubmittedWindow } from "../types/loan";

export const LOAN_PAGE_SIZE = 10;
const sorts: readonly LoanSort[] = ["newest", "oldest", "amount_desc", "amount_asc"];
const windows: readonly SubmittedWindow[] = ["7", "30", "90"];
const currencies = ["USD", "KHR"] as const;
type Filters = Pick<LoanListParams, "q" | "status" | "loanType" | "currency" | "submitted" | "sort">;

const oneOf = <T extends string>(values: readonly T[], value: string | null) => values.find((item) => item === value);

/** The list's whole state lives in the URL, so it survives refresh and back/forward navigation. */
export function useLoanListState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = useMemo<LoanListParams>(() => {
    const page = Number.parseInt(searchParams.get("page") ?? "1", 10);
    return {
      page: Number.isFinite(page) && page > 0 ? page : 1,
      pageSize: LOAN_PAGE_SIZE,
      q: searchParams.get("q")?.trim() || undefined,
      status: oneOf(loanStatuses, searchParams.get("status")),
      loanType: oneOf(loanTypes, searchParams.get("loanType")),
      currency: oneOf(currencies, searchParams.get("currency")),
      submitted: oneOf(windows, searchParams.get("submitted")),
      sort: oneOf(sorts, searchParams.get("sort")),
    };
  }, [searchParams]);

  const write = useCallback((next: Partial<LoanListParams>) => {
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
    reset: () => write({ q: undefined, status: undefined, loanType: undefined, currency: undefined, submitted: undefined, page: 1 }),
  };
}
