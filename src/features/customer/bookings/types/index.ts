import type { AddOns, Quote } from "../lib/pricing";

export type BookingStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

export type ApiBookingStatus = "pending" | "confirmed" | "ready_for_pickup" | "active" | "returned" | "completed" | "cancelled" | "expired" | "no_show";
export type ApiPaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded" | "partially_refunded";
export type BookingPricing = { dailyRateMinor: number; rentalSubtotalMinor: number; addonsTotalMinor: number; platformFeeMinor: number; taxesMinor: number; securityDepositMinor: number; totalPayableMinor: number };
export type BookingAddonLine = { code: string | null; name: string; unitPriceMinor: number; quantity: number; days: number; totalMinor: number };
export type BookingAddon = { code: string; name: string; description: string | null; pricePerDayMinor: number; currency: "USD" };
export type BookingPlace = { id: string; name: string; city: string; address: string };
export type ApiBooking = {
  reference: string;
  bookingStatus: ApiBookingStatus;
  paymentStatus: ApiPaymentStatus;
  vehicle: { id: string; slug: string; name: string; brand: string; model: string };
  pickupLocation: BookingPlace;
  returnLocation: BookingPlace;
  pickupAt: string;
  returnAt: string;
  rentalDays: number;
  currency: "USD";
  pricing: BookingPricing;
  addons: BookingAddonLine[];
  holdExpiresAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
};
export type BookingQuote = { currency: "USD"; rentalDays: number; pricing: BookingPricing; addons: BookingAddonLine[] };
export type BookingRequest = {
  vehicle?: string;
  group?: { brand: string; model: string; locationId: string };
  pickupLocationId?: string;
  returnLocationId?: string;
  pickupAt: string;
  returnAt: string;
  addons?: { code: string; quantity?: number }[];
};
export type BookingListParams = { page?: number; pageSize?: number; status?: ApiBookingStatus; group?: "upcoming" | "active" | "completed" | "cancelled" };
export type BookingCancelInput = { reason?: string };

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
  idempotencyKey?: string;
};
