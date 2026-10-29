"use client";

import { oneOf, useListState } from "@/hooks/use-list-state";
import { supportTicketCategories, supportTicketStatuses, type SupportTicketListParams, type SupportTicketSort } from "../types/feedback";

export const FEEDBACK_PAGE_SIZE = 10;
const sorts: readonly SupportTicketSort[] = ["newest", "oldest"];
const read = (search: URLSearchParams): SupportTicketListParams => ({
  page: Math.max(1, Number.parseInt(search.get("page") ?? "1", 10) || 1), pageSize: FEEDBACK_PAGE_SIZE,
  q: search.get("q")?.trim() || undefined, status: oneOf(supportTicketStatuses, search.get("status")),
  category: oneOf(supportTicketCategories, search.get("category")), sort: oneOf(sorts, search.get("sort")),
});
const reset = { q: undefined, status: undefined, category: undefined };

export function useFeedbackListState() {
  return useListState<SupportTicketListParams>({
    read,
    reset,
  });
}
