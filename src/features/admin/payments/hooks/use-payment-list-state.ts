"use client";

import { oneOf, useListState } from "@/hooks/use-list-state";
import { paymentStatuses, type PaymentListParams, type PaymentSort, type PaymentWindow } from "../types/payment";

export const PAYMENT_PAGE_SIZE = 10;
const sorts: readonly PaymentSort[] = ["newest", "oldest", "amount_desc", "amount_asc"];
const windows: readonly PaymentWindow[] = ["7", "30", "90"];
const read = (search: URLSearchParams): PaymentListParams => ({
  page: Math.max(1, Number.parseInt(search.get("page") ?? "1", 10) || 1), pageSize: PAYMENT_PAGE_SIZE,
  q: search.get("q")?.trim() || undefined, status: oneOf(paymentStatuses, search.get("status")), method: search.get("method") || undefined,
  currency: "USD", window: oneOf(windows, search.get("window")), sort: oneOf(sorts, search.get("sort")),
});
const reset = { q: undefined, status: undefined, method: undefined, window: undefined };

export function usePaymentListState() {
  return useListState<PaymentListParams>({
    read,
    reset,
  });
}
