import { t } from "elysia";
import { Currency, Envelope } from "@/libs/api";
import { BookingStatus, PaymentStatus } from "../booking/model";

const Reference = t.Object({ reference: t.String({ minLength: 1 }) });

const CheckoutForm = t.Object(
  {
    action: t.String({ format: "uri" }),
    method: t.Literal("POST"),
    fields: t.Record(t.String(), t.String()),
  },
  { description: "Submit these fields as a form POST to `action` (a browser form post, not fetch) to open the ABA PayWay KHQR page" },
);

const AttemptStatus = t.UnionEnum(["pending", "paid", "failed"]);

export const PaymentStart = {
  Params: Reference,
  Response: Envelope(
    t.Object({
      transactionId: t.String(),
      amountMinor: t.Number(),
      currency: Currency,
      expiresAt: t.Nullable(t.String({ format: "date-time", description: "The booking hold: pay before this or the booking expires" })),
      checkout: CheckoutForm,
    }),
  ),
};

export const PaymentGet = {
  Params: Reference,
  Response: Envelope(
    t.Object({
      bookingStatus: BookingStatus,
      paymentStatus: PaymentStatus,
      attempt: t.Nullable(t.Object({ transactionId: t.String(), status: AttemptStatus, paidAt: t.Nullable(t.String({ format: "date-time" })) })),
    }),
  ),
};

export const PaywayCallbackPost = {
  Response: Envelope(t.Object({ received: t.Literal(true), status: AttemptStatus })),
};
