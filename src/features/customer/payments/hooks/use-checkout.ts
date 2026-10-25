"use client";

import { useQuery } from "@tanstack/react-query";
import { getPayment } from "../api/generated";
import { customerPaymentKeys } from "../query-keys.generated";

const POLL_MS = 4_000;

/** Asks the backend for the booking's payment while it is open; the backend verifies with PayWay, so this settles even if a callback was missed. */
export function useBookingPayment(reference: string, enabled: boolean) {
  return useQuery({
    queryKey: customerPaymentKeys.getPayment(reference),
    queryFn: ({ signal }) => getPayment(reference, signal),
    enabled: enabled && process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true",
    refetchInterval: (query) => {
      const attempt = query.state.data?.attempt;
      return attempt && attempt.status !== "pending" ? false : POLL_MS;
    },
  });
}
