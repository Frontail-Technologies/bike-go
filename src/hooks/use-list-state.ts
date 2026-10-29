"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

type ListParams = { page: number; pageSize: number; [key: string]: unknown };

export const oneOf = <T extends string>(values: readonly T[], value: string | null) => values.find((item) => item === value);

export function useListState<T extends ListParams>(options: {
  read: (search: URLSearchParams) => T;
  reset: Partial<T>;
  pathname?: string;
}) {
  const { read, reset: resetValues, pathname: explicitPathname } = options;
  const router = useRouter();
  const currentPathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const params = useMemo(() => read(new URLSearchParams(search)), [read, search]);
  const pathname = explicitPathname ?? currentPathname;

  const write = useCallback((next: Partial<T>) => {
    const merged = { ...params, ...next };
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (key === "pageSize" || value === undefined || value === "" || value === false || (key === "page" && value === 1)) continue;
      query.set(key, String(value));
    }
    const search = query.toString();
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
  }, [params, pathname, router]);

  const setPage = useCallback((page: number) => write({ page } as Partial<T>), [write]);
  const setFilters = useCallback((filters: Partial<Omit<T, "page" | "pageSize">>) => write({ ...filters, page: 1 } as Partial<T>), [write]);
  const reset = useCallback(() => write({ ...resetValues, page: 1 }), [resetValues, write]);
  return { params, setPage, setFilters, reset };
}

export function pageCount(meta: { totalPages?: number; total?: number; pageSize?: number } | undefined) {
  return meta?.totalPages ?? Math.max(1, Math.ceil((meta?.total ?? 0) / (meta?.pageSize ?? 1)));
}

export function activeFilterCount(params: ListParams, ignored: readonly string[] = ["page", "pageSize", "sort", "sortBy", "sortOrder"]) {
  return Object.entries(params).filter(([key, value]) => !ignored.includes(key) && value !== undefined && value !== "" && value !== false).length;
}

export function sortingFor<T extends string>(sortBy: T | undefined, sortOrder: "asc" | "desc" | undefined) {
  return sortBy ? [{ id: sortBy, desc: sortOrder === "desc" }] : [];
}
