"use client";

import { oneOf, useListState } from "@/hooks/use-list-state";
import { bannerStatuses, placements, type BannerListParams, type BannerSort } from "../types/banner";

export const BANNER_PAGE_SIZE = 10;
const sorts: readonly BannerSort[] = ["displayOrder", "newest", "oldest", "title", "startAt", "endAt"];
const read = (search: URLSearchParams): BannerListParams => ({
  page: Math.max(1, Number.parseInt(search.get("page") ?? "1", 10) || 1), pageSize: BANNER_PAGE_SIZE,
  q: search.get("q")?.trim() || undefined,
  placement: oneOf(placements, search.get("placement")),
  status: oneOf(bannerStatuses, search.get("status")),
  sort: oneOf(sorts, search.get("sort")),
});
const reset = { q: undefined, placement: undefined, status: undefined };

export function useBannerListState() {
  return useListState<BannerListParams>({
    read,
    reset,
  });
}
