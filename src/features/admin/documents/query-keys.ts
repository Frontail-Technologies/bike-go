import type { DocumentListParams } from "./types/document";

export const adminDocumentQueryKeys = {
  root: () => ["admin", "documents"] as const,
  list: (params: DocumentListParams) => ["admin", "documents", "list", params] as const,
  stats: () => ["admin", "documents", "stats"] as const,
  detail: (id: string) => ["admin", "documents", "detail", id] as const,
} as const;
