import { Elysia } from "elysia";
import { audit } from "@/libs/audit";
import { ok, okPage, sessionSecurity, staffErrors } from "@/libs/api";
import { authPlugin } from "@/plugins/auth";
import * as BookingModel from "./model";
import { adminGetBooking, adminListBookings, updateBookingStatus } from "./service";

export const adminBookingRoutes = new Elysia({ name: "RideGo.Admin.Booking", prefix: "/bookings", tags: ["Admin"] })
  .use(authPlugin)
  .get("", { admin: true, query: BookingModel.BookingsGet.Query, response: { 200: BookingModel.BookingsGet.Response, ...staffErrors }, detail: { summary: "Bookings, with search, filters, date range and sorting", security: sessionSecurity } }, async ({ query }) => okPage(await adminListBookings(query)))
  .get("/:reference", { admin: true, params: BookingModel.BookingGet.Params, response: { 200: BookingModel.BookingGet.Response, ...staffErrors }, detail: { summary: "One booking with its customer", security: sessionSecurity } }, async ({ params }) => ok(await adminGetBooking(params.reference)))
  .patch(
    "/:reference/status",
    {
      admin: true,
      params: BookingModel.BookingStatusPatch.Params,
      body: BookingModel.BookingStatusPatch.Body,
      response: { 200: BookingModel.BookingStatusPatch.Response, ...staffErrors },
      detail: {
        summary: "Update a booking's status and/or payment state",
        description: "Booking status follows the allowed path (see `allowedNextStatuses`); payment status is set by hand until a payment provider is integrated.",
        security: sessionSecurity,
      },
    },
    async ({ params, body, user, request, server }) => {
      const updated = await updateBookingStatus(params.reference, body);
      await audit({ user, request, server }, "booking.status", { type: "booking", id: params.reference, details: { bookingStatus: body.bookingStatus, paymentStatus: body.paymentStatus } });
      return ok(updated);
    },
  );
