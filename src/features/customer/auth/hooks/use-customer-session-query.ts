"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customerAuthApi } from "../api/customer-auth-api";
import { customerAuthKeys } from "../query-keys";
import type { TelegramLoginPayload } from "../types";

export function useCustomerSessionQuery() {
  return useQuery({
    queryKey: customerAuthKeys.session(),
    queryFn: customerAuthApi.session,
    staleTime: 60_000,
    retry: false,
    refetchOnMount: true,
  });
}

export function useClearCustomerSession() {
  const queryClient = useQueryClient();
  return () => queryClient.setQueryData(customerAuthKeys.session(), null);
}

export function useCustomerAuthMutations() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: customerAuthKeys.session() });
  const clearSession = useClearCustomerSession();

  return {
    google: useMutation({ mutationFn: (callbackURL: string) => customerAuthApi.signInWithGoogle(callbackURL) }),
    telegram: useMutation({ mutationFn: (payload: TelegramLoginPayload) => customerAuthApi.signInWithTelegram(payload), onSuccess: refresh }),
    logout: useMutation({ mutationFn: customerAuthApi.signOut }),
    clearSession,
  };
}
