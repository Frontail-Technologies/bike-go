import { t, type UnwrapModels, type UnwrapSchema } from "elysia";
import { Currency, Envelope, PaginationQuery } from "@/libs/api";

const IsoDateTime = t.String({ format: "date-time", description: "ISO-8601 with an offset, for example 2026-11-01T10:00:00+07:00" });

export const BookingStatus = t.UnionEnum(["pending", "confirmed", "ready_for_pickup", "active", "completed", "cancelled", "expired"]);
export const PaymentStatus = t.UnionEnum(["unpaid", "pending", "paid", "failed", "refunded", "partially_refunded"]);

const BookingRequest = {
  vehicle: t.String({ minLength: 1, description: "Vehicle slug or UUID" }),
  pickupLocationId: t.Optional(t.String({ format: "uuid", description: "Defaults to the vehicle's location; must be where the vehicle is" })),
  returnLocationId: t.Optional(t.String({ format: "uuid", description: "Defaults to the pickup location" })),
  pickupAt: IsoDateTime,
  returnAt: IsoDateTime,
  addons: t.Optional(t.Array(t.Object({ code: t.String({ minLength: 1 }), quantity: t.Optional(t.Integer({ minimum: 1, maximum: 4 })) }), { maxItems: 10 })),
};

const Pricing = t.Object({
  dailyRateMinor: t.Number(),
  rentalSubtotalMinor: t.Number(),
  addonsTotalMinor: t.Number(),
  platformFeeMinor: t.Number(),
  taxesMinor: t.Number(),
  securityDepositMinor: t.Number({ description: "Refundable; included in the total payable" }),
  totalPayableMinor: t.Number(),
});

const AddonLine = t.Object({ code: t.Nullable(t.String()), name: t.String(), unitPriceMinor: t.Number(), quantity: t.Number(), days: t.Number(), totalMinor: t.Number() });

export const Quote = t.Object({ currency: Currency, rentalDays: t.Number(), pricing: Pricing, addons: t.Array(AddonLine) });

const Place = t.Object({ id: t.String({ format: "uuid" }), name: t.String(), city: t.String(), address: t.String() });

export const Booking = t.Object({
  reference: t.String(),
  bookingStatus: BookingStatus,
  paymentStatus: PaymentStatus,
  vehicle: t.Object({ id: t.String({ format: "uuid" }), slug: t.String(), name: t.String(), brand: t.String(), model: t.String() }),
  pickupLocation: Place,
  returnLocation: Place,
  pickupAt: t.String({ format: "date-time" }),
  returnAt: t.String({ format: "date-time" }),
  rentalDays: t.Number(),
  currency: Currency,
  pricing: Pricing,
  addons: t.Array(AddonLine),
  holdExpiresAt: t.Nullable(t.String({ format: "date-time", description: "While pending, the vehicle is held until this time; after it the booking becomes expired" })),
  cancelledAt: t.Nullable(t.String({ format: "date-time" })),
  cancellationReason: t.Nullable(t.String()),
  createdAt: t.String({ format: "date-time" }),
});

export const AddonsGet = {
  Response: Envelope(t.Array(t.Object({ code: t.String(), name: t.String(), description: t.Nullable(t.String()), pricePerDayMinor: t.Number(), currency: Currency }))),
};

export const QuotePost = { Body: t.Object(BookingRequest), Response: Envelope(Quote) };

export const BookingsGet = {
  Query: t.Object({ ...PaginationQuery.properties, status: t.Optional(BookingStatus) }),
  Response: Envelope(t.Array(Booking)),
};

export const BookingPost = {
  Headers: t.Object({ "idempotency-key": t.Optional(t.String({ minLength: 8, maxLength: 128, description: "Send the same key when retrying so a booking is created only once" })) }),
  Body: t.Object(BookingRequest),
  Response: Envelope(Booking),
};

export const BookingByReferenceGet = {
  Params: t.Object({ reference: t.String({ pattern: "^RG\\d{8}$", description: "Booking reference, for example RG84021977" }) }),
  Response: Envelope(Booking),
};

export const BookingCancelPost = {
  Params: BookingByReferenceGet.Params,
  Body: t.Optional(t.Object({ reason: t.Optional(t.String({ maxLength: 300 })) })),
  Response: Envelope(Booking),
};

export type BookingRequest = UnwrapModels<typeof BookingPost>["Body"];
export type BookingsGet = UnwrapModels<typeof BookingsGet>;
export type BookingView = UnwrapSchema<typeof Booking>;
export type QuoteView = UnwrapSchema<typeof Quote>;
