"use client";

import type { ReactNode } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { useAdminSessionQuery } from "../hooks/use-admin-session-query";

export function SessionPendingGate({ fallback, children }: { fallback: ReactNode; children: ReactNode }) {
  const session = useAdminSessionQuery();
  const hydrated = useHydrated();
  return !hydrated || session.isPending ? fallback : children;
}
