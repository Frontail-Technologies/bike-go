"use client";

import { AirplaneTiltIcon, BankIcon, BriefcaseIcon, FileTextIcon, HouseLineIcon, IdentificationCardIcon, ReceiptIcon } from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { toVerificationBadge } from "@/features/admin/loans/lib/loan-model";
import type { DocumentType } from "@/features/admin/loans/types/loan";
import { cn } from "@/lib/cn";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";
import { formatDateTime, formatShort } from "@/lib/date";

export function ReviewStatusBadge({ status, className }: { status: string; className?: string }) {
  useAdminTranslations();
  const badge = toVerificationBadge(status);
  return <AdminStatusBadge status={badge.status} label={badge.label} className={className} />;
}

const icons: Record<DocumentType, Icon> = {
  passport: IdentificationCardIcon, visa_or_residence_permit: AirplaneTiltIcon, employment_proof: BriefcaseIcon, salary_or_income_proof: ReceiptIcon,
  address_proof: HouseLineIcon, bank_statement: BankIcon, other: FileTextIcon,
};

export function DocumentTypeIcon({ type, className }: { type: DocumentType; className?: string }) {
  const Glyph = icons[type] ?? FileTextIcon;
  return <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-surface-muted)] text-[var(--admin-muted)]", className)}><Glyph size={20} weight="duotone" aria-hidden /></span>;
}

export const isPdf = (mimeType: string) => mimeType === "application/pdf";

export const fmtDateTime = formatDateTime;
export const fmtShort = formatShort;
