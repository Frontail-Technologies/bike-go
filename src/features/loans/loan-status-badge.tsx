import { StatusBadge } from "@/components/ui/status-badge";
import { type LoanStatus, statusMeta } from "./data";

export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  const { label, tone } = statusMeta[status];
  return <StatusBadge tone={tone}>{label}</StatusBadge>;
}
