import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { toLoanBadge } from "@/features/admin/loans/lib/loan-model";

export function LoanStatusBadge({ status, className }: { status: string; className?: string }) {
  const badge = toLoanBadge(status);
  return <AdminStatusBadge status={badge.status} label={badge.label} className={className} />;
}
