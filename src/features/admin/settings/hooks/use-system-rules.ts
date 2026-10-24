"use client";

import { useQuery } from "@tanstack/react-query";
import { systemRulesApi } from "../api/system-rules-api";
import { systemRulesQueryKeys } from "../query-keys";

export const useSystemRulesQuery = () => useQuery({ queryKey: systemRulesQueryKeys.all, queryFn: systemRulesApi.get, staleTime: 5 * 60_000 });
