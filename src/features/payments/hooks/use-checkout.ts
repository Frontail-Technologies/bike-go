"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { checkoutApi } from "../api/checkout-api";

const POLL_MS = 4_000;

export const checkoutKeys = { status: (reference: string) => ["payment", "status", reference] as const };

export function useStartPayment(reference: string) {
  return useMutation({ mutationFn: () => checkoutApi.start(reference) });
}

/** Asks the backend for the booking's payment while it is open; the backend verifies with PayWay, so this settles even if a callback was missed. */
export function useBookingPayment(reference: string, enabled: boolean) {
  return useQuery({
    queryKey: checkoutKeys.status(reference),
    queryFn: () => checkoutApi.status(reference),
    enabled,
    refetchInterval: (query) => {
      const attempt = query.state.data?.attempt;
      return attempt && attempt.status !== "pending" ? false : POLL_MS;
    },
  });
}
