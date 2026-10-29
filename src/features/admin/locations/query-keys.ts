export type AdminLocationListParams = Record<string, string | number | boolean | undefined>;

export const adminLocationQueryKeys = {
  root: () => ["admin", "locations"] as const,
  list: (params: AdminLocationListParams) => ["admin", "locations", "list", params] as const,
  detail: (id: string) => ["admin", "locations", "detail", id] as const,
} as const;
