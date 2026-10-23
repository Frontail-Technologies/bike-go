"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { markNavigated } from "@/lib/nav-history";

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
