import { t, type UnwrapModels, type UnwrapSchema } from "elysia";
import { Envelope, PaginationQuery } from "@/libs/api";
import { Booking, BookingStatus, BookingByReferenceGet, PaymentStatus } from "@/routes/booking/model";

export const AdminBooking = t.Object({
  ...Booking.properties,
  customer: t.Object({ id: t.String({ format: "uuid" }), name: t.String(), email: t.Nullable(t.String()), phone: t.Nullable(t.String()) }),
  allowedNextStatuses: t.Array(BookingStatus, { description: "Statuses staff may move this booking to right now" }),
});

export const BookingsGet = {
  Query: t.Object({
    ...PaginationQuery.properties,
    status: t.Optional(BookingStatus),
    paymentStatus: t.Optional(PaymentStatus),
    vehicleId: t.Optional(t.String({ format: "uuid" })),
    locationId: t.Optional(t.String({ format: "uuid", description: "Pickup location" })),
    q: t.Optional(t.String({ minLength: 1, description: "Reference, customer name or email, or vehicle name" })),
    pickupFrom: t.Optional(t.String({ format: "date-time", description: "Pickup at or after" })),
    pickupTo: t.Optional(t.String({ format: "date-time", description: "Pickup before" })),
    sort: t.Optional(t.UnionEnum(["newest", "pickup_asc", "pickup_desc", "total_desc"])),
  }),
  Response: Envelope(t.Array(AdminBooking)),
};

export const BookingGet = { Params: BookingByReferenceGet.Params, Response: Envelope(AdminBooking) };

export const BookingStatusPatch = {
  Params: BookingByReferenceGet.Params,
  Body: t.Object(
    {
      bookingStatus: t.Optional(BookingStatus),
      paymentStatus: t.Optional(PaymentStatus),
      note: t.Optional(t.String({ minLength: 2, maxLength: 300, description: "Stored as the cancellation reason when cancelling" })),
    },
    { additionalProperties: false, minProperties: 1 },
  ),
  Response: Envelope(AdminBooking),
};

export type AdminBookingView = UnwrapSchema<typeof AdminBooking>;
export type BookingsGet = UnwrapModels<typeof BookingsGet>;
export type BookingStatusPatch = UnwrapModels<typeof BookingStatusPatch>;
