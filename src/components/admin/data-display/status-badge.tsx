import { cn } from "@/lib/cn";

export type AdminStatus =
  | "available" | "rented" | "maintenance" | "inactive" | "active" | "scheduled" | "ready-for-pickup" | "unpaid" | "partially-refunded" | "draft" | "submitted" | "action-required" | "eligibility"
  | "pending" | "confirmed" | "ongoing" | "returned" | "completed" | "cancelled" | "no-show"
  | "paid" | "partially-paid" | "refunded" | "failed"
  | "under-review" | "approved" | "rejected"
  | "verified" | "needs-review" | "expired";

const labels: Record<AdminStatus, string> = {
  active: "Active", scheduled: "Scheduled", "ready-for-pickup": "Ready for pickup", draft: "Draft", submitted: "Submitted", "action-required": "Action required", eligibility: "Eligibility review", unpaid: "Unpaid", "partially-refunded": "Partially refunded", available: "Available", rented: "Rented", maintenance: "Maintenance", inactive: "Inactive",
  pending: "Pending", confirmed: "Confirmed", ongoing: "On Rent", returned: "Returned", completed: "Completed", cancelled: "Cancelled", "no-show": "No Show",
  paid: "Paid", "partially-paid": "Partially paid", refunded: "Refunded", failed: "Failed",
  "under-review": "Under review", approved: "Approved", rejected: "Rejected",
  verified: "Verified", "needs-review": "Needs review", expired: "Expired",
};

const tones: Record<AdminStatus, string> = {
  active: "bg-[var(--admin-success-soft)] text-[var(--admin-success)]",
  scheduled: "bg-[#efe9ff] text-[#6246c7]",
  "ready-for-pickup": "bg-[#efe9ff] text-[#6246c7]",
  eligibility: "bg-[#efe9ff] text-[#6246c7]",
  submitted: "bg-[#efe9ff] text-[#6246c7]",
  "action-required": "bg-[#ffe9d6] text-[#b4540a]",
  draft: "bg-[var(--admin-surface-muted)] text-[var(--admin-muted)]",
  unpaid: "bg-[var(--admin-surface-muted)] text-[var(--admin-muted)]",
  "partially-refunded": "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]",
  available: "bg-[var(--admin-success-soft)] text-[var(--admin-success)]",
  completed: "bg-[var(--admin-success-soft)] text-[var(--admin-success)]",
  paid: "bg-[var(--admin-success-soft)] text-[var(--admin-success)]",
  approved: "bg-[var(--admin-success-soft)] text-[var(--admin-success)]",
  verified: "bg-[var(--admin-success-soft)] text-[var(--admin-success)]",
  confirmed: "bg-[#efe9ff] text-[#6246c7]",
  ongoing: "bg-[#efe9ff] text-[#6246c7]",
  returned: "bg-[#e8f5f2] text-[#147d68]",
  rented: "bg-[#efe9ff] text-[#6246c7]",
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

export function AdminStatusBadge({ status, className, label }: { status: AdminStatus; className?: string; label?: string }) {
  return <span className={cn("inline-flex min-h-6 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold", tones[status], className)}>{label ?? labels[status]}</span>;
}

export const adminStatusVariants = Object.keys(labels) as AdminStatus[];
