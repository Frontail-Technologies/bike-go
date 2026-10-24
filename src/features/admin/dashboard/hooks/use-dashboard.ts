"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard-api";
import { adminDashboardQueryKeys } from "../query-keys";
import type { DashboardRange } from "../types/dashboard";

export function useDashboardQuery(range: DashboardRange) {
  return useQuery({
    queryKey: adminDashboardQueryKeys.overview(range),
    queryFn: () => dashboardApi.overview(range),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}
