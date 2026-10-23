import type { BookingStatus } from "@/features/mock/data";
import type { AddOns, Quote } from "./pricing";

export type RiderDetails = { name: string; phone: string; email: string };

export type CustomerBooking = {
  reference: string;
  bikeId: string;
  status: BookingStatus;
  startDate: string;
  endDate: string;
  pickupTime: string;
  dropTime: string;
  city: string;
  addOns: AddOns;
  quote: Quote;
  rider: RiderDetails;
  licenceNumber: string | null;
  paymentMethod: string;
  createdAt: string;
  cancelledAt?: string;
};

export type BookingDraft = {
  bikeId: string;
  start: string | null;
  end: string | null;
  pickupTime: string;
  dropTime: string;
  addOns: AddOns;
  rider: RiderDetails;
  licenceNumber: string;
  licenceLater: boolean;
  payment: string;
};
