import { Elysia } from "elysia";
import { ok, staffErrors } from "@/libs/api";
import { authPlugin } from "@/plugins/auth";
import * as BookingModel from "./model";
import { adminGetBooking, adminListBookings, updateBookingStatus } from "./service";

const security = [{ sessionCookie: [] }];

export const adminBookingRoutes = new Elysia({ name: "RideGo.Admin.Booking", prefix: "/bookings", tags: ["Admin"] })
  .use(authPlugin)
  .get("", { admin: true, query: BookingModel.BookingsGet.Query, response: { 200: BookingModel.BookingsGet.Response, ...staffErrors }, detail: { summary: "Bookings, with search, filters, date range and sorting", security } }, async ({ query }) => {
    const { data, meta } = await adminListBookings(query);
    return ok(data, meta);
  })
  .get("/:reference", { admin: true, params: BookingModel.BookingGet.Params, response: { 200: BookingModel.BookingGet.Response, ...staffErrors }, detail: { summary: "One booking with its customer", security } }, async ({ params }) => ok(await adminGetBooking(params.reference)))
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
        security,
      },
    },
    async ({ params, body }) => ok(await updateBookingStatus(params.reference, body)),
  );
