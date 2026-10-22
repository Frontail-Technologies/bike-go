"use client";

import { getBike } from "@/features/mock/data";
import { bookingsStore } from "./store";

/** Look up a booking (and its bike) by public reference. `undefined` when it doesn't exist. */
export function useBooking(reference: string) {
  const booking = bookingsStore.useValue().find((b) => b.reference === reference);
  const bike = booking ? getBike(booking.bikeId) : undefined;
  return booking && bike ? { booking, bike } : undefined;
}

export function maskLicence(number: string | null) {
  if (!number) return "Show at pickup";
  return `${number.slice(0, 4)} •••• ••••${number.slice(-3)}`;
}
