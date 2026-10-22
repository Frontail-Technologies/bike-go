import { t } from "elysia";
import { Currency, Envelope } from "@/libs/api";

const Counts = t.Record(t.String(), t.Number(), { description: "Count per status" });

export const DashboardGet = {
  Response: Envelope(
    t.Object({
      vehicles: t.Object({ total: t.Number(), byStatus: Counts }),
      bookings: t.Object({
        total: t.Number(),
        byStatus: Counts,
        activeNow: t.Number({ description: "Bookings currently in the active state" }),
        upcomingPickups7d: t.Number({ description: "Confirmed or ready-for-pickup bookings starting within 7 days" }),
        revenue: t.Array(
          t.Object({
            currency: Currency,
            bookedMinor: t.Number({ description: "Rental, add-ons, fees and taxes of confirmed, ready, active and completed bookings. Pending holds, cancelled and expired bookings are excluded, and so is the refundable deposit." }),
            paidMinor: t.Number({ description: "The same, for bookings whose payment is marked paid" }),
          }),
        ),
      }),
      loans: t.Object({ total: t.Number(), byStatus: Counts, awaitingReview: t.Number({ description: "Submitted, documents under review or eligibility review" }) }),
      customers: t.Object({ total: t.Number(), newLast30Days: t.Number() }),
      recentBookings: t.Array(
        t.Object({ reference: t.String(), bookingStatus: t.String(), customerName: t.String(), vehicleName: t.String(), pickupAt: t.String({ format: "date-time" }), totalPayableMinor: t.Number(), currency: Currency }),
      ),
      recentLoans: t.Array(
        t.Object({ reference: t.String(), status: t.String(), applicantName: t.Nullable(t.String()), loanType: t.String(), requestedAmountMinor: t.Number(), currency: Currency, createdAt: t.String({ format: "date-time" }) }),
      ),
    }),
  ),
};
