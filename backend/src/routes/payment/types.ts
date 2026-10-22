import type { payments } from "@/libs/db/schema";

export type PaymentRow = typeof payments.$inferSelect;
export type PaymentReview = "amount_mismatch" | "paid_after_hold_expired" | "booking_cancelled";
