"use client";

import { useQuery } from "@tanstack/react-query";
import * as api from "../api/home-api";
import type { HomeData } from "../types";

const homeKey = ["customer", "home"] as const;

export function useHomeQuery(initialData: HomeData) {
  return useQuery({
    queryKey: homeKey,
    queryFn: ({ signal }) => api.getHome(signal),
    initialData,
    // Server-rendered data may come from Next's fetch cache; paint it, then refetch at once.
    initialDataUpdatedAt: 0,
  });
}
