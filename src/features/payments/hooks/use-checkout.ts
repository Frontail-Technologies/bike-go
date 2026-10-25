"use client";

import { useQuery } from "@tanstack/react-query";
import { getPayment, startPayment } from "../api/generated";

const POLL_MS = 4_000;

export const checkoutKeys = { status: (reference: string) => ["payment", "status", reference] as const };

export function useStartPayment(reference: string) {
  return { mutateAsync: () => startPayment(reference), isPending: false, isError: false, error: null };
}

/** Asks the backend for the booking's payment while it is open; the backend verifies with PayWay, so this settles even if a callback was missed. */
export function useBookingPayment(reference: string, enabled: boolean) {
  return useQuery({
    queryKey: checkoutKeys.status(reference),
    queryFn: ({ signal }) => getPayment(reference, signal),
    enabled: enabled && process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true",
    refetchInterval: (query) => {
      const attempt = query.state.data?.attempt;
      return attempt && attempt.status !== "pending" ? false : POLL_MS;
    },
  });
}
