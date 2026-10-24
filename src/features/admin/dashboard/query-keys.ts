/** Query identities for administrator dashboard data. */
export const adminDashboardQueryKeys = {
  root: () => ["admin", "dashboard"] as const,
  overview: (range: "7d" | "30d" | "90d") => ["admin", "dashboard", "overview", range] as const,
} as const;
