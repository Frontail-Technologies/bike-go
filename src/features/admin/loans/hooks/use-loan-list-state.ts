"use client";

import { oneOf, useListState } from "@/hooks/use-list-state";
import { loanStatuses, loanTypes, type LoanListParams, type LoanSort, type SubmittedWindow } from "../types/loan";

export const LOAN_PAGE_SIZE = 10;
const sorts: readonly LoanSort[] = ["newest", "oldest", "amount_desc", "amount_asc"];
const windows: readonly SubmittedWindow[] = ["7", "30", "90"];
const read = (search: URLSearchParams): LoanListParams => ({
  page: Math.max(1, Number.parseInt(search.get("page") ?? "1", 10) || 1), pageSize: LOAN_PAGE_SIZE,
  q: search.get("q")?.trim() || undefined, status: oneOf(loanStatuses, search.get("status")), loanType: oneOf(loanTypes, search.get("loanType")),
  currency: "USD", submitted: oneOf(windows, search.get("submitted")), sort: oneOf(sorts, search.get("sort")),
});
const reset = { q: undefined, status: undefined, loanType: undefined, submitted: undefined };

export function useLoanListState() {
  return useListState<LoanListParams>({
    read,
    reset,
  });
}
