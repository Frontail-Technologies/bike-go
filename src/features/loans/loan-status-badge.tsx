"use client";

import { StatusBadge } from "@/components/ui/status-badge";
import { type LoanStatus, statusMeta } from "./data";
import { useLoanText } from "./use-loan-text";

export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  const { status: text } = useLoanText();
  return <StatusBadge tone={statusMeta[status].tone}>{text(status, "label")}</StatusBadge>;
}
