import { getBike } from "@/features/mock/data";
import { type AddOns, getQuote } from "./pricing";
import { rentalDaysBetween } from "./dates";
import type { CustomerBooking } from "./types";

const rider = { name: "Rahul Sharma", phone: "9876543210", email: "rahul.sharma@gmail.com" };

function seed(
  reference: string,
  bikeId: string,
  status: CustomerBooking["status"],
  startDate: string,
  endDate: string,
  addOns: AddOns = { helmet: true, jacket: false },
  extra: Partial<CustomerBooking> = {},
): CustomerBooking {
  const bike = getBike(bikeId);
  if (!bike) throw new Error(`Unknown bike ${bikeId}`);
  return {
    reference,
    bikeId,
    status,
    startDate,
    endDate,
    pickupTime: "10:00 AM",
    dropTime: "10:00 AM",
    city: bike.location,
    addOns,
    quote: getQuote(bike, rentalDaysBetween(startDate, endDate), addOns),
    rider,
    licenceNumber: "RJ14 2021 0012345",
    paymentMethod: "ABA KHQR",
    createdAt: `${startDate}T08:00:00`,
    ...extra,
  };
}

/** Starting bookings so every My Bookings tab has realistic content. */
export const seedBookings: CustomerBooking[] = [
  seed("RG820461", "royal-enfield-classic-350", "upcoming", "2026-11-12", "2026-11-14"),
  seed("RG820388", "royal-enfield-hunter-350", "ongoing", "2026-10-21", "2026-10-24", { helmet: true, jacket: true }),
  seed("RG819902", "yamaha-mt-15", "completed", "2026-09-12", "2026-09-14"),
  seed("RG819215", "honda-cb350", "completed", "2026-08-03", "2026-08-05", { helmet: false, jacket: false }),
  seed("RG818740", "ktm-duke-200", "cancelled", "2026-10-05", "2026-10-07", { helmet: false, jacket: false }, {
    cancelledAt: "2026-10-03T18:20:00",
  }),
];
