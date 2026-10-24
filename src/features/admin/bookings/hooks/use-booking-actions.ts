"use client";

import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/error";
import { bookingLabels } from "../lib/booking-model";
import type { Booking, BookingStatus, HandoverInput, ReturnInput } from "../types/booking";
import { useBookingMutations } from "./use-bookings";

export const actionErrorMessage = (error: unknown) => (error instanceof ApiError ? error.message : "Something went wrong. Try again.");

const success: Partial<Record<BookingStatus, (reference: string) => string>> = {
  confirmed: (reference) => `${reference} confirmed`,
  ready_for_pickup: (reference) => `${reference} is ready for pickup`,
  cancelled: (reference) => `${reference} cancelled`,
  no_show: (reference) => `${reference} marked as no show`,
  completed: (reference) => `${reference} completed`,
};

/** Lifecycle actions for a booking. They reject with an ApiError so each dialog can show the backend's reason. */
export function useBookingActions() {
  const mutations = useBookingMutations();
  return {
    advance: async (booking: Pick<Booking, "reference">, bookingStatus: BookingStatus, note?: string): Promise<Booking> => {
      const updated = await mutations.updateStatus.mutateAsync({ reference: booking.reference, bookingStatus, ...(note ? { note } : {}) });
      toast.success(success[bookingStatus]?.(booking.reference) ?? `${booking.reference} is now ${bookingLabels[bookingStatus]}`);
      return updated;
    },
    startRental: async (booking: Pick<Booking, "reference">, input: HandoverInput) => {
      const updated = await mutations.handover.mutateAsync({ reference: booking.reference, ...input });
      toast.success(`Rental started for ${booking.reference}`);
      return updated;
    },
    returnVehicle: async (booking: Pick<Booking, "reference">, input: ReturnInput) => {
      const updated = await mutations.returnVehicle.mutateAsync({ reference: booking.reference, ...input });
      toast.success(`${booking.reference} returned`);
      return updated;
    },
    isPending: mutations.updateStatus.isPending || mutations.handover.isPending || mutations.returnVehicle.isPending,
  };
}
