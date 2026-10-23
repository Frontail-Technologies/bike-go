import { AirplaneTiltIcon, BankIcon, BriefcaseIcon, FileTextIcon, HouseLineIcon, IdentificationCardIcon, ReceiptIcon } from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { cn } from "@/lib/cn";
import { type DocumentType, type ReviewStatus, reviewLabels } from "./document-data";

const tone = { uploaded: "submitted", verified: "verified", "needs-review": "needs-review", rejected: "rejected" } as const;
export function ReviewStatusBadge({ status, className }: { status: ReviewStatus; className?: string }) {
  return <AdminStatusBadge status={tone[status]} label={reviewLabels[status]} className={className} />;
}

const icons: Record<DocumentType, Icon> = {
  Passport: IdentificationCardIcon, "Visa / Residence permit": AirplaneTiltIcon, "Employment proof": BriefcaseIcon, "Salary / income proof": ReceiptIcon,
  "Address proof": HouseLineIcon, "Bank statement": BankIcon, Other: FileTextIcon,
};

export function DocumentTypeIcon({ type, className }: { type: DocumentType; className?: string }) {
  const Glyph = icons[type];
  return <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-surface-muted)] text-[var(--admin-muted)]", className)}><Glyph size={20} weight="duotone" aria-hidden /></span>;
}
