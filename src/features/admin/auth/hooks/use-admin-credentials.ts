"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAuthApi } from "../api/admin-auth-api";
import { adminAuthQueryKeys } from "../query-keys";
import type { AdminSession } from "../types/session";

/** Signs an administrator in and stores the new session, so the admin shell has it immediately. */
export function useAdminLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminAuthApi.login,
    onSuccess: (session: AdminSession) => queryClient.setQueryData(adminAuthQueryKeys.session(), session),
  });
}

/** Changes the administrator's password; the server returns the refreshed session. */
export function useAdminChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string; confirmPassword?: string }) =>
      adminAuthApi.changePassword({ currentPassword, newPassword }),
    onSuccess: (session: AdminSession) => queryClient.setQueryData(adminAuthQueryKeys.session(), session),
  });
}
