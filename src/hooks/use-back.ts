"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { hasInAppHistory } from "@/lib/nav-history";

/**
 * Back that never traps the user: pops history when they got here from inside the app, otherwise
 * (deep link, refresh, shared URL) replaces with `fallback` so Back lands somewhere sensible.
 */
export function useBack(fallback: string) {
  const router = useRouter();
  return useCallback(() => {
    if (hasInAppHistory()) router.back();
    else router.replace(fallback);
  }, [router, fallback]);
}
