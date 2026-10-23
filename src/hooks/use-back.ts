"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { hasInAppHistory } from "@/lib/nav-history";

export function useBack(fallback: string) {
  const router = useRouter();
  return useCallback(() => {
    if (hasInAppHistory()) router.back();
    else router.replace(fallback);
  }, [router, fallback]);
}
