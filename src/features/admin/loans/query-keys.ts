import type { LoanListParams } from "./types/loan";

export const adminLoanQueryKeys = {
  root: () => ["admin", "loans"] as const,
  list: (params: LoanListParams) => ["admin", "loans", "list", params] as const,
  stats: () => ["admin", "loans", "stats"] as const,
  detail: (reference: string) => ["admin", "loans", "detail", reference] as const,
} as const;
