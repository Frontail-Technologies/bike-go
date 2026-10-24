/** Query identities for the separate administrator session boundary. */
export const adminAuthQueryKeys = {
  session: () => ["admin", "auth", "session"] as const,
} as const;
