"use client";

import { getBike } from "@/features/mock/data";
import { bookingsStore } from "./store";

export function useBooking(reference: string) {
  const booking = bookingsStore.useValue().find((b) => b.reference === reference);
  const bike = booking ? getBike(booking.bikeId) : undefined;
  return booking && bike ? { booking, bike } : undefined;
}

export function maskLicence(number: string | null, fallback = "") {
  if (!number) return fallback;
  return `${number.slice(0, 4)} •••• ••••${number.slice(-3)}`;
}
