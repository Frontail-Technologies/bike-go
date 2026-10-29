"use client";

import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { toLoanBadge } from "@/features/admin/loans/lib/loan-model";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

export function LoanStatusBadge({ status, className }: { status: string; className?: string }) {
  useAdminTranslations();
  const badge = toLoanBadge(status);
  return <AdminStatusBadge status={badge.status} label={badge.label} className={className} />;
}
