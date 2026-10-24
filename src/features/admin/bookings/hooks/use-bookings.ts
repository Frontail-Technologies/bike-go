"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminDashboardQueryKeys } from "@/features/admin/dashboard/query-keys";
import { adminVehicleQueryKeys } from "@/features/admin/vehicles/query-keys";
import { bookingsApi } from "../api/bookings-api";
import { adminBookingQueryKeys } from "../query-keys";
import type { Booking, BookingListParams, BookingStatusInput, HandoverInput, ReturnInput } from "../types/booking";

export function useBookingsQuery(params: BookingListParams) {
  return useQuery({
    queryKey: adminBookingQueryKeys.list(params),
    queryFn: () => bookingsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useBookingQuery(reference: string) {
  return useQuery({ queryKey: adminBookingQueryKeys.detail(reference), queryFn: () => bookingsApi.get(reference) });
}

/** Every lifecycle action returns the fresh booking, so the detail cache is replaced and the lists refetch. */
export function useBookingMutations() {
  const client = useQueryClient();
  const settle = (booking: Booking) => {
    client.setQueryData(adminBookingQueryKeys.detail(booking.reference), booking);
    void client.invalidateQueries({ queryKey: adminBookingQueryKeys.root() });
    // Handover and completion change the vehicle's status, and every transition moves dashboard counts.
    void client.invalidateQueries({ queryKey: adminVehicleQueryKeys.root() });
    void client.invalidateQueries({ queryKey: adminDashboardQueryKeys.root() });
  };
  return {
    updateStatus: useMutation({ mutationFn: ({ reference, ...input }: { reference: string } & BookingStatusInput) => bookingsApi.updateStatus(reference, input), onSuccess: settle }),
    handover: useMutation({ mutationFn: ({ reference, ...input }: { reference: string } & HandoverInput) => bookingsApi.handover(reference, input), onSuccess: settle }),
    returnVehicle: useMutation({ mutationFn: ({ reference, ...input }: { reference: string } & ReturnInput) => bookingsApi.returnVehicle(reference, input), onSuccess: settle }),
  };
}
