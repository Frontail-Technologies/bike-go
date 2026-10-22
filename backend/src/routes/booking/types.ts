import type { UnwrapModels, UnwrapSchema } from "elysia";
import type { bookings, vehicles } from "@/libs/db/schema";
import type { Currency } from "@/libs/types";
import type * as Model from "./model";

export type BookingStatus = "pending" | "confirmed" | "ready_for_pickup" | "active" | "completed" | "cancelled" | "expired";

export type BookingRequest = UnwrapModels<typeof Model.BookingPost>["Body"];
export type BookingsGet = UnwrapModels<typeof Model.BookingsGet>;
export type BookingView = UnwrapSchema<typeof Model.Booking>;
export type QuoteView = UnwrapSchema<typeof Model.Quote>;

export type BookingRow = typeof bookings.$inferSelect;
export type VehicleRow = typeof vehicles.$inferSelect;

export type PricingInput = {
  currency: Currency;
  days: number;
  dailyRateMinor: number;
  securityDepositMinor: number;
  addons: { addonId: string; name: string; unitPriceMinor: number; quantity: number }[];
  taxRateBps: number;
  platformFeeMinor: number;
};

export type PricingResult = {
  currency: Currency;
  days: number;
  dailyRateMinor: number;
  rentalSubtotalMinor: number;
  addons: { addonId: string; name: string; unitPriceMinor: number; quantity: number; days: number; totalMinor: number }[];
  addonsTotalMinor: number;
  platformFeeMinor: number;
  taxesMinor: number;
  securityDepositMinor: number;
  totalPayableMinor: number;
};

export type PreparedBooking = {
  vehicle: VehicleRow;
  pickupLocationId: string;
  returnLocationId: string;
  pickupAt: Date;
  returnAt: Date;
  days: number;
  pricing: PricingResult;
  addonCodes: Map<string, string>;
};

export type HoldScope = { vehicleId?: string; userId?: string; reference?: string };
