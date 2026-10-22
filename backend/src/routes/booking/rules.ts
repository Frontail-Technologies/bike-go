import { AppError } from "@/libs/api";
import type { BookingStatus } from "./types";

export const STAFF_BOOKING_TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["ready_for_pickup", "cancelled"],
  ready_for_pickup: ["active", "cancelled"],
  active: ["completed"],
  completed: [],
  cancelled: [],
  expired: [],
};

export function assertBookingTransition(from: BookingStatus, to: BookingStatus) {
  if (!STAFF_BOOKING_TRANSITIONS[from].includes(to)) {
    throw new AppError("INVALID_BOOKING_STATUS", 409, `A booking that is ${from.replaceAll("_", " ")} cannot move to ${to.replaceAll("_", " ")}.`, { from, to, allowed: STAFF_BOOKING_TRANSITIONS[from] });
  }
}
