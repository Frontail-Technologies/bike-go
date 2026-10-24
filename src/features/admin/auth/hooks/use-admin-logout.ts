"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { adminAuthApi } from "../api/admin-auth-api";
import { adminAuthQueryKeys } from "../query-keys";

/** Ends only the separate administrator cookie session. */
export function useAdminLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: adminAuthApi.logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: adminAuthQueryKeys.session() });
      router.replace("/admin/login");
    },
  });
}
