"use client";

import { useState } from "react";

/**
 * The path to treat as current for a nav highlight. Tapping a link moves the highlight at once instead of
 * waiting for the new route to load, so the sliding indicator starts on the tap. Once the real pathname
 * changes (or the navigation is abandoned and it doesn't), the real one wins again.
 */
export function useOptimisticNav(pathname: string) {
  const [intent, setIntent] = useState<{ href: string; from: string } | null>(null);
  const current = intent && intent.from === pathname ? intent.href : pathname;
  return { current, navigate: (href: string) => setIntent({ href, from: pathname }) };
}
