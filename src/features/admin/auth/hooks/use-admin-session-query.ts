"use client";

import { useQuery } from "@tanstack/react-query";
import { isApiError } from "@/lib/api/error";
import { adminAuthApi } from "../api/admin-auth-api";
import { adminAuthQueryKeys } from "../query-keys";

/** The sole React Query owner of the remote administrator session. */
export function useAdminSessionQuery() {
  return useQuery({
    queryKey: adminAuthQueryKeys.session(),
    queryFn: adminAuthApi.me,
    retry: false,
    staleTime: 60_000,
    throwOnError: false,
    meta: { auth: true },
  });
}

export const isUnauthenticatedAdmin = (error: unknown) =>
  isApiError(error) && error.status === 401;
