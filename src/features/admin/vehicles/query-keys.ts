export type AdminVehicleListParams = Record<string, string | number | boolean | undefined>;

export const adminVehicleQueryKeys = {
  root: () => ["admin", "vehicles"] as const,
  list: (params: AdminVehicleListParams) => ["admin", "vehicles", "list", params] as const,
  detail: (id: string) => ["admin", "vehicles", "detail", id] as const,
  availability: (id: string) => ["admin", "vehicles", "availability", id] as const,
} as const;
