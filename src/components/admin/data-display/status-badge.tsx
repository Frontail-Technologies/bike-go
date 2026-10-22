import { cn } from "@/lib/cn";

export type AdminStatus =
  | "available" | "rented" | "maintenance" | "inactive"
  | "pending" | "confirmed" | "ongoing" | "completed" | "cancelled" | "no-show"
  | "paid" | "partially-paid" | "refunded" | "failed"
  | "under-review" | "approved" | "rejected"
  | "verified" | "needs-review" | "expired";

const labels: Record<AdminStatus, string> = {
  available: "Available", rented: "Rented", maintenance: "Maintenance", inactive: "Inactive",
  pending: "Pending", confirmed: "Confirmed", ongoing: "Ongoing", completed: "Completed", cancelled: "Cancelled", "no-show": "No show",
  paid: "Paid", "partially-paid": "Partially paid", refunded: "Refunded", failed: "Failed",
  "under-review": "Under review", approved: "Approved", rejected: "Rejected",
  verified: "Verified", "needs-review": "Needs review", expired: "Expired",
};

const tones: Record<AdminStatus, string> = {
  available: "bg-[var(--admin-success-soft)] text-[var(--admin-success)]",
  completed: "bg-[var(--admin-success-soft)] text-[var(--admin-success)]",
  paid: "bg-[var(--admin-success-soft)] text-[var(--admin-success)]",
  approved: "bg-[var(--admin-success-soft)] text-[var(--admin-success)]",
  verified: "bg-[var(--admin-success-soft)] text-[var(--admin-success)]",
  confirmed: "bg-[var(--admin-info-soft)] text-[var(--admin-info)]",
  ongoing: "bg-[var(--admin-info-soft)] text-[var(--admin-info)]",
  rented: "bg-[var(--admin-info-soft)] text-[var(--admin-info)]",
  pending: "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]",
  "under-review": "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]",
  "needs-review": "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]",
  "partially-paid": "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]",
  maintenance: "bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]",
  cancelled: "bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]",
  failed: "bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]",
  rejected: "bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]",
  expired: "bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]",
  inactive: "bg-[var(--admin-surface-muted)] text-[var(--admin-muted)]",
  "no-show": "bg-[var(--admin-surface-muted)] text-[var(--admin-muted)]",
  refunded: "bg-[var(--admin-surface-muted)] text-[var(--admin-muted)]",
};

export function AdminStatusBadge({ status, className }: { status: AdminStatus; className?: string }) {
  return <span className={cn("inline-flex min-h-6 items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold", tones[status], className)}>{labels[status]}</span>;
}

export const adminStatusVariants = Object.keys(labels) as AdminStatus[];
