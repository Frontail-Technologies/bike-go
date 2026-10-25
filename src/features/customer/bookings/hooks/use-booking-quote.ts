"use client";

import { useQuery } from "@tanstack/react-query";
import { quoteBooking } from "../api/bookings-api";
import { customerBookingKeys } from "../query-keys";
import type { BookingRequest } from "../types";

export function useBookingQuoteQuery(input: BookingRequest | null) {
  return useQuery({
    queryKey: [...customerBookingKeys.root(), "quote", input] as const,
    queryFn: () => quoteBooking(input!),
    enabled: input !== null,
    staleTime: 15_000,
  });
}
