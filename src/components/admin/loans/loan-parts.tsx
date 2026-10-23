import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { type DocumentStatus, documentStatusLabels } from "./loan-data";
import { type LoanStatus, toLoanBadge } from "./loan-types";

export function LoanStatusBadge({ status, className }: { status: LoanStatus; className?: string }) {
  const badge = toLoanBadge(status);
  return <AdminStatusBadge status={badge.status} label={badge.label} className={className} />;
}

const documentTone = { uploaded: "submitted", verified: "verified", "needs-review": "needs-review", rejected: "rejected", missing: "failed" } as const;
export function DocumentStatusBadge({ status, className }: { status: DocumentStatus; className?: string }) {
  return <AdminStatusBadge status={documentTone[status]} label={documentStatusLabels[status]} className={className} />;
}
