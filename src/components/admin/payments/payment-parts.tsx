import { PaymentStatusBadge } from "@/components/admin/bookings/booking-parts";
import { cn } from "@/lib/cn";
import { type PaymentType, typeLabels } from "./payment-data";

export { PaymentStatusBadge };

export function PaymentTypeBadge({ type, className }: { type: PaymentType; className?: string }) {
  return <span className={cn("inline-flex min-h-6 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold", type === "booking" ? "bg-[var(--admin-info-soft)] text-[var(--admin-info)]" : "bg-[#efe9ff] text-[#6246c7]", className)}>{typeLabels[type]}</span>;
}
