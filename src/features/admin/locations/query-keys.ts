export type AdminLocationListParams = Record<string, string | number | boolean | undefined>;

/** Query identities local to the locations feature. */
export const adminLocationQueryKeys = {
  root: () => ["admin", "locations"] as const,
  list: (params: AdminLocationListParams) => ["admin", "locations", "list", params] as const,
  detail: (id: string) => ["admin", "locations", "detail", id] as const,
} as const;
