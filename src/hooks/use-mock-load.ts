"use client";

import { useEffect, useState } from "react";

/** Simulates a first data fetch so skeleton states are real, not decorative. Remove once data is remote. */
export function useMockLoad(ms = 400) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), ms);
    return () => window.clearTimeout(id);
  }, [ms]);
  return loading;
}
