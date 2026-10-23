"use client";

import { createPersistedStore } from "@/lib/persisted-store";
import { seedBookings } from "./seed";
import type { BookingDraft, CustomerBooking } from "./types";

export const bookingsStore = createPersistedStore<CustomerBooking[]>("rgo.bookings.v2", seedBookings);

export const draftStore = createPersistedStore<BookingDraft | null>("rgo.draft.v1", null, "session");

export const justBookedStore = createPersistedStore<string | null>("rgo.justbooked.v1", null, "session");

export function newReference(): string {
  return `RG${Math.floor(820500 + Math.random() * 99000)}`;
}

export function addBooking(booking: CustomerBooking) {
  bookingsStore.update((all) => [booking, ...all]);
}

export function cancelBooking(reference: string) {
  bookingsStore.update((all) =>
    all.map((b) =>
      b.reference === reference ? { ...b, status: "cancelled", cancelledAt: new Date().toISOString() } : b,
    ),
  );
}
