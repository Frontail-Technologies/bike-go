"use client";

import { Button } from "@heroui/react";
import { CalendarBlankIcon, FilePdfIcon, ImageIcon } from "@phosphor-icons/react";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { type ReviewDocument, fmtShort } from "./document-data";
import { DocumentTypeIcon, ReviewStatusBadge } from "./document-parts";

export function AdminDocumentCard({ document, onReview, onOpenLoan }: { document: ReviewDocument; onReview: (document: ReviewDocument) => void; onOpenLoan: (document: ReviewDocument) => void }) {
  const FormatIcon = document.format === "pdf" ? FilePdfIcon : ImageIcon;
  return (
    <article className="adminSurface adminLift flex min-w-0 flex-col gap-3 rounded-2xl p-4">
      <header className="flex items-start gap-3">
        <DocumentTypeIcon type={document.type} />
        <div className="min-w-0 flex-1"><h3 className="truncate text-[15px] font-extrabold leading-tight">{document.type}</h3><p className="flex items-center gap-1 truncate text-xs text-[var(--admin-muted)]"><FormatIcon size={12} aria-hidden className="shrink-0" /><span className="truncate">{document.fileName}</span></p></div>
        <ReviewStatusBadge status={document.status} />
      </header>
      <div className="flex items-center gap-2.5"><CustomerAvatar name={document.applicant.name} size="sm" className="size-8 text-[11px]" /><div className="min-w-0"><p className="truncate text-sm font-semibold">{document.applicant.name}</p><p className="truncate text-xs text-[var(--admin-muted)]">{document.loanReference} · {document.loanType}</p></div></div>
      <p className="flex items-center gap-2 text-xs text-[var(--admin-muted)]"><CalendarBlankIcon size={14} aria-hidden />Uploaded {fmtShort(document.uploadedAt)} ICT</p>
      <div className="mt-auto grid grid-cols-2 gap-2 border-t border-[var(--admin-border)] pt-3">
        <Button variant="primary" className="min-h-11 md:min-h-9" onPress={() => onReview(document)}>Review</Button>
        <Button variant="outline" className="min-h-11 md:min-h-9" onPress={() => onOpenLoan(document)}>Open Application</Button>
      </div>
    </article>
  );
}
