/** Stable query-key factories for all administrator server state. */
export const adminQueryKeys = {
  root: ["admin"] as const,
  dashboard: () => [...adminQueryKeys.root, "dashboard"] as const,
  vehicles: (params: Record<string, string | number | boolean | undefined>) => [...adminQueryKeys.root, "vehicles", params] as const,
  vehicle: (id: string) => [...adminQueryKeys.root, "vehicles", id] as const,
  locations: (params: Record<string, string | number | boolean | undefined>) => [...adminQueryKeys.root, "locations", params] as const,
  session: () => [...adminQueryKeys.root, "session"] as const,
} as const;
