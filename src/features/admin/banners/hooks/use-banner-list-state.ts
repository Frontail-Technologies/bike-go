"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { bannerStatuses, placements, type BannerListParams, type BannerSort } from "../types/banner";

export const BANNER_PAGE_SIZE = 10;
const sorts: readonly BannerSort[] = ["displayOrder", "newest", "oldest", "title", "startAt", "endAt"];
type Filters = Pick<BannerListParams, "q" | "placement" | "status" | "sort">;

const oneOf = <T extends string>(values: readonly T[], value: string | null) => values.find((item) => item === value);

/** The list's whole state lives in the URL, so it survives refresh and back/forward navigation. */
export function useBannerListState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = useMemo<BannerListParams>(() => {
    const page = Number.parseInt(searchParams.get("page") ?? "1", 10);
    return {
      page: Number.isFinite(page) && page > 0 ? page : 1,
      pageSize: BANNER_PAGE_SIZE,
      q: searchParams.get("q")?.trim() || undefined,
      placement: oneOf(placements, searchParams.get("placement")),
      status: oneOf(bannerStatuses, searchParams.get("status")),
      sort: oneOf(sorts, searchParams.get("sort")),
    };
  }, [searchParams]);

  const write = useCallback((next: Partial<BannerListParams>) => {
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
    reset: () => write({ q: undefined, placement: undefined, status: undefined, page: 1 }),
  };
}
