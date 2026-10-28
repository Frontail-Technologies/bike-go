"use client";

import { useQuery } from "@tanstack/react-query";
import { getPayment } from "../api/payments-api";
import { customerPaymentKeys } from "../query-keys";

const POLL_MS = 4_000;

/** Asks the backend for the booking's payment while it is open; the backend verifies with PayWay, so this settles even if a callback was missed. */
export function useBookingPayment(reference: string, enabled: boolean) {
  return useQuery({
    queryKey: customerPaymentKeys.getPayment(reference),
    queryFn: ({ signal }) => getPayment(reference, signal),
    enabled,
    // Only poll while a payment attempt is actually open; a single fetch otherwise
    // (e.g. to learn paymentsEnabled before any attempt has started) is enough.
    refetchInterval: (query) => query.state.data?.attempt?.status === "pending" ? POLL_MS : false,
  });
}
