import { AdminStatusBadge, type AdminStatus } from "@/components/admin/data-display/status-badge";
import { paymentLabels, toBadge } from "@/features/admin/bookings/lib/booking-model";
import type { BookingStatus, PaymentStatus } from "@/features/admin/bookings/types/booking";

export function BookingStatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  const badge = toBadge(status);
  return <AdminStatusBadge status={badge.status} label={badge.label} className={`${badge.className ?? ""} ${className ?? ""}`} />;
}

/** Accepts backend values (`partially_refunded`) and the Payments mock's dashed form. */
export function PaymentStatusBadge({ status, className }: { status: string; className?: string }) {
  return <AdminStatusBadge status={status.replaceAll("_", "-") as AdminStatus} label={paymentLabels[status.replaceAll("-", "_") as PaymentStatus] ?? status} className={className} />;
}
