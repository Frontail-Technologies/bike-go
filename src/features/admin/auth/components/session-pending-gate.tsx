"use client";

import type { ReactNode } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { useAdminSessionQuery } from "../hooks/use-admin-session-query";

/** Holds role-dependent pages back until the administrator session has resolved. */
export function SessionPendingGate({ fallback, children }: { fallback: ReactNode; children: ReactNode }) {
  const session = useAdminSessionQuery();
  const hydrated = useHydrated();
  return !hydrated || session.isPending ? fallback : children;
}
