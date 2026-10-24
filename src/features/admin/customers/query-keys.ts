import type { CustomerListParams, PageParams } from "./types/customer";

/** Query identities local to the customers feature. */
export const adminCustomerQueryKeys = {
  root: () => ["admin", "customers"] as const,
  list: (params: CustomerListParams) => ["admin", "customers", "list", params] as const,
  stats: () => ["admin", "customers", "stats"] as const,
  detail: (id: string) => ["admin", "customers", "detail", id] as const,
  activity: (id: string, page: PageParams) => ["admin", "customers", "activity", id, page] as const,
  bookings: (id: string, page: PageParams) => ["admin", "customers", "bookings", id, page] as const,
  loans: (id: string, page: PageParams) => ["admin", "customers", "loans", id, page] as const,
  documents: (id: string, page: PageParams) => ["admin", "customers", "documents", id, page] as const,
} as const;
