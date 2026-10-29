"use client";

import { useQuery } from "@tanstack/react-query";
import { getPaymentQuery } from "../queries";

const POLL_MS = 4_000;

export function useBookingPayment(reference: string, enabled: boolean) {
  return useQuery({
    ...getPaymentQuery(reference),
    enabled: enabled && Boolean(reference),
    refetchInterval: (query) => query.state.data?.attempt?.status === "pending" ? POLL_MS : false,
  });
}
