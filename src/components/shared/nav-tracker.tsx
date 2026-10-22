"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { markNavigated } from "@/lib/nav-history";

/** Records client-side route changes so `useBack` knows whether history exists inside the app. */
export function NavTracker() {
  const pathname = usePathname();
  const previous = useRef(pathname);

  useEffect(() => {
    if (previous.current !== pathname) {
      previous.current = pathname;
      markNavigated();
    }
  }, [pathname]);

  return null;
}
