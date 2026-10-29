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
    // Customer route layouts hydrate this query from the request cookie. Let the
    // normal stale-time policy refresh it instead of requesting the session again
    // every time a protected page mounts.
    refetchOnMount: true,
  });
}

/** Marks the customer as signed out in the cache right away (logout, or the API reporting a 401). */
export function useClearCustomerSession() {
  const queryClient = useQueryClient();
  return () => queryClient.setQueryData(customerAuthKeys.session(), null);
}

export function useCustomerAuthMutations() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: customerAuthKeys.session() });
  // Called synchronously before navigating away on logout, so the destination never
  // waits on (or briefly sees stale data from) the sign-out request.
  const clearSession = useClearCustomerSession();

  return {
    google: useMutation({ mutationFn: (callbackURL: string) => customerAuthApi.signInWithGoogle(callbackURL) }),
    telegram: useMutation({ mutationFn: (payload: TelegramLoginPayload) => customerAuthApi.signInWithTelegram(payload), onSuccess: refresh }),
    logout: useMutation({ mutationFn: customerAuthApi.signOut }),
    clearSession,
  };
}
