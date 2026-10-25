"use client";

import { useBookingQuery } from "./generated";
import { apiBookingToView } from "../lib/booking-mapper";

export function useBooking(reference: string) {
  const query = useBookingQuery(reference);
  return query.data ? { ...apiBookingToView(query.data), paymentStatus: query.data.paymentStatus } : undefined;
}

export function maskLicence(number: string | null, fallback = "") {
  if (!number) return fallback;
  return `${number.slice(0, 4)} •••• ••••${number.slice(-3)}`;
}
