import { asc, eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { customerErrors, ok, okPage, publicErrors, sessionSecurity } from "@/libs/api";
import { db } from "@/libs/db";
import { bookingAddons } from "@/libs/db/schema";
import { authPlugin } from "@/plugins/auth";
import * as BookingModel from "./model";
import { cancelMyBooking, createBooking, getMyBooking, listMyBookings, quote } from "./service";

export const addonRoutes = new Elysia({ name: "RideGo.Addons", prefix: "/api/v1/addons", tags: ["Bookings"] }).get(
  "",
  { response: { 200: BookingModel.AddonsGet.Response, ...publicErrors }, detail: { summary: "Optional add-ons (helmet, jacket...) and their per-day prices" } },
  async () =>
    ok(
      await db
        .select({ code: bookingAddons.code, name: bookingAddons.name, description: bookingAddons.description, pricePerDayMinor: bookingAddons.pricePerDayMinor, currency: bookingAddons.currency })
        .from(bookingAddons)
        .where(eq(bookingAddons.active, true))
        .orderBy(asc(bookingAddons.name)),
    ),
);

export const bookingRoutes = new Elysia({ name: "RideGo.Booking", prefix: "/api/v1/bookings", tags: ["Bookings"] })
  .use(authPlugin)
  .post(
    "/quote",
    {
      body: BookingModel.QuotePost.Body,
      response: { 200: BookingModel.QuotePost.Response, ...publicErrors },
      detail: { summary: "Price a booking without creating it", description: "The server prices from current database values. Use this for display, never to send totals back: creating a booking recomputes everything." },
    },
    async ({ body }) => ok(await quote(body)),
  )
  .get(
    "",
    { auth: true, query: BookingModel.BookingsGet.Query, response: { 200: BookingModel.BookingsGet.Response, ...customerErrors }, detail: { summary: "My bookings, newest first", security: sessionSecurity } },
    async ({ user, query }) => okPage(await listMyBookings(user.id, query)),
  )
  .get(
    "/:reference",
    { auth: true, params: BookingModel.BookingByReferenceGet.Params, response: { 200: BookingModel.BookingByReferenceGet.Response, ...customerErrors }, detail: { summary: "One of my bookings", security: sessionSecurity } },
    async ({ user, params }) => ok(await getMyBooking(user.id, params.reference)),
  )
  .post(
    "",
    {
      auth: true,
      headers: BookingModel.BookingPost.Headers,
      body: BookingModel.BookingPost.Body,
      response: { 201: BookingModel.BookingPost.Response, ...customerErrors },
      detail: {
        summary: "Create a booking",
        description:
          "The server checks availability inside a transaction and prices the booking itself; any totals sent are ignored. Send an `Idempotency-Key` header and retry safely: the same key and request returns the original booking. A taken period is `409 BOOKING_CONFLICT`.",
        security: sessionSecurity,
      },
    },
    async ({ user, body, headers, status, set }) => {
      const result = await createBooking(user.id, body, headers["idempotency-key"]);
      if (result.replayed) set.headers["idempotent-replayed"] = "true";
      return status(201, ok(result.body));
    },
  )
  .post(
    "/:reference/cancel",
    {
      auth: true,
      params: BookingModel.BookingCancelPost.Params,
      body: BookingModel.BookingCancelPost.Body,
      response: { 200: BookingModel.BookingCancelPost.Response, ...customerErrors },
      detail: { summary: "Cancel my booking", description: "Allowed while pending, confirmed or ready for pickup. Cancelled bookings stop holding the vehicle immediately.", security: sessionSecurity },
    },
    async ({ user, params, body }) => ok(await cancelMyBooking(user.id, params.reference, body?.reason)),
  );
