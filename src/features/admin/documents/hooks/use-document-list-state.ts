"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { documentTypes, verificationStatuses } from "@/features/admin/loans/types/loan";
import type { DocumentListParams, DocumentSort, UploadedWindow } from "../types/document";

export const DOCUMENT_PAGE_SIZE = 10;
const sorts: readonly DocumentSort[] = ["newest", "oldest"];
const windows: readonly UploadedWindow[] = ["7", "30", "90"];
type Filters = Pick<DocumentListParams, "q" | "status" | "type" | "uploaded" | "sort">;

const oneOf = <T extends string>(values: readonly T[], value: string | null) => values.find((item) => item === value);

export function useDocumentListState() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = "/admin/documents";

  const params = useMemo<DocumentListParams>(() => {
    const page = Number.parseInt(searchParams.get("page") ?? "1", 10);
    return {
      page: Number.isFinite(page) && page > 0 ? page : 1,
      pageSize: DOCUMENT_PAGE_SIZE,
      q: searchParams.get("q")?.trim() || undefined,
      status: oneOf(verificationStatuses, searchParams.get("status")),
      type: oneOf(documentTypes, searchParams.get("type")),
      uploaded: oneOf(windows, searchParams.get("uploaded")),
      sort: oneOf(sorts, searchParams.get("sort")),
    };
  }, [searchParams]);

  const write = useCallback((next: Partial<DocumentListParams>) => {
    const merged = { ...params, ...next };
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (key === "pageSize" || value === undefined || value === "" || (key === "page" && value === 1)) continue;
      query.set(key, String(value));
    }
    const search = query.toString();
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
  }, [params, router]);

  return {
    params,
    setPage: (page: number) => write({ page }),
    setFilters: (filters: Partial<Filters>) => write({ ...filters, page: 1 }),
    reset: () => write({ q: undefined, status: undefined, type: undefined, uploaded: undefined, page: 1 }),
  };
}
