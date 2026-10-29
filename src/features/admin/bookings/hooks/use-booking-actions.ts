"use client";

import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/error";
import { adminT } from "@/features/admin/i18n/translate";
import { bookingLabels } from "../lib/booking-model";
import type { Booking, BookingStatus, HandoverInput, ReturnInput } from "../types/booking";
import { useBookingMutations } from "./use-bookings";

export const actionErrorMessage = (error: unknown) => (error instanceof ApiError ? error.message : adminT("common.genericError"));

const successStatuses: ReadonlyArray<BookingStatus> = ["confirmed", "ready_for_pickup", "cancelled", "no_show", "completed"];

export function useBookingActions() {
  const mutations = useBookingMutations();
  return {
    advance: async (booking: Pick<Booking, "reference">, bookingStatus: BookingStatus, note?: string): Promise<Booking> => {
      const updated = await mutations.updateStatus.mutateAsync({ reference: booking.reference, bookingStatus, ...(note ? { note } : {}) });
      toast.success(successStatuses.includes(bookingStatus) ? adminT(`bookings.toast.${bookingStatus}`, { reference: booking.reference }) : adminT("bookings.toast.now", { reference: booking.reference, status: bookingLabels[bookingStatus] }));
      return updated;
    },
    startRental: async (booking: Pick<Booking, "reference">, input: HandoverInput) => {
      const updated = await mutations.handover.mutateAsync({ reference: booking.reference, ...input });
      toast.success(adminT("bookings.toast.started", { reference: booking.reference }));
      return updated;
    },
    returnVehicle: async (booking: Pick<Booking, "reference">, input: ReturnInput) => {
      const updated = await mutations.returnVehicle.mutateAsync({ reference: booking.reference, ...input });
      toast.success(adminT("bookings.toast.returned", { reference: booking.reference }));
      return updated;
    },
    isPending: mutations.updateStatus.isPending || mutations.handover.isPending || mutations.returnVehicle.isPending,
  };
}
