"use client";

import { useQuery } from "@tanstack/react-query";
import { listBookingOptions } from "../api/booking-options-api";
import { customerBookingKeys } from "../query-keys";

export function useBookingOptionsQuery() {
  return useQuery({ queryKey: [...customerBookingKeys.root(), "options"], queryFn: ({ signal }) => listBookingOptions(signal), staleTime: 60_000 });
}
