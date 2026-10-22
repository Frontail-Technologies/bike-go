import { Elysia } from "elysia";
import { customerErrors, notFound, ok, publicErrors, sessionSecurity } from "@/libs/api";
import { authPlugin } from "@/plugins/auth";
import { transactionIdFromCallback } from "./callback";
import * as PaymentModel from "./model";
import { getBookingPayment, settlePayment, startPayment } from "./service";

export const paymentRoutes = new Elysia({ name: "RideGo.Payment", prefix: "/api/v1", tags: ["Payments"] })
  .use(authPlugin)
  .post(
    "/bookings/:reference/payments",
    {
      auth: true,
      params: PaymentModel.PaymentStart.Params,
      response: { 200: PaymentModel.PaymentStart.Response, ...customerErrors },
      detail: {
        summary: "Start paying for a pending booking with ABA PayWay (KHQR)",
        description:
          "The amount is always the booking's stored total, never a client value. Returns a signed form: submit it as a browser form POST to open the PayWay page. Calling again while an attempt is open returns the same transaction. The booking is confirmed only after the server verifies the transaction with PayWay.",
        security: sessionSecurity,
      },
    },
    async ({ user, params }) => ok(await startPayment(user.id, params.reference)),
  )
  .get(
    "/bookings/:reference/payment",
    {
      auth: true,
      params: PaymentModel.PaymentGet.Params,
      response: { 200: PaymentModel.PaymentGet.Response, ...customerErrors },
      detail: {
        summary: "Payment state of my booking",
        description: "While an attempt is open this asks PayWay for the result, so polling it after the customer returns from PayWay settles the booking even if the callback was missed.",
        security: sessionSecurity,
      },
    },
    async ({ user, params }) => ok(await getBookingPayment(user.id, params.reference)),
  )
  .post(
    "/payments/payway/callback",
    {
      parse: "text",
      response: { 200: PaymentModel.PaywayCallbackPost.Response, ...publicErrors },
      detail: {
        summary: "PayWay payment notification",
        description: "The body is never trusted: only the transaction id is read, and the result is verified server to server with PayWay before anything changes. Unknown transactions are `404` without contacting PayWay.",
      },
    },
    async ({ body }) => {
      const attempt = await settlePayment(transactionIdFromCallback(typeof body === "string" ? body : ""));
      if (!attempt) throw notFound("Transaction");
      return ok({ received: true as const, status: attempt.status });
    },
  );
