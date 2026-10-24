"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Description, Drawer, FieldError, Label, TextArea, TextField } from "@heroui/react";
import { ArrowSquareOutIcon, CheckCircleIcon, FilePdfIcon, ImageIcon, WarningCircleIcon, XCircleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityTimeline, type ActivityItem } from "@/components/admin/data-display/misc";
import { AdminErrorState } from "@/components/admin/feedback";
import { toast } from "@/components/ui/toast";
import { documentTypeLabel } from "@/features/admin/loans/lib/loan-model";
import { ApiError } from "@/lib/api/error";
import { documentFileUrl } from "../api/documents-api";
import { useDocumentQuery, useDocumentReview } from "../hooks/use-documents";
import { reviewSchema, type ReviewValues } from "../schemas/document-schemas";
import type { DocumentDecision, ReviewDocumentDetail } from "../types/document";
import { DocumentTypeIcon, fmtDateTime, isPdf, ReviewStatusBadge } from "./document-parts";

const NOTE_LIMIT = 300;
const decisionCopy: Record<DocumentDecision, { label: string; placeholder: string; required: boolean }> = {
  verified: { label: "Verify document", placeholder: "Optional note", required: false },
  needs_review: { label: "Mark as needs review", placeholder: "What should be checked again?", required: true },
  rejected: { label: "Reject document", placeholder: "Image is blurred. Please upload a clearer passport copy.", required: true },
};

const failure = (error: unknown) => (error instanceof ApiError ? error.message : "Something went wrong. Try again.");

function DecisionForm({ document, decision, onBack, onDone }: { document: ReviewDocumentDetail; decision: DocumentDecision; onBack: () => void; onDone: () => void }) {
  const review = useDocumentReview();
  const [error, setError] = useState("");
  const copy = decisionCopy[decision];
  const form = useForm<ReviewValues>({ resolver: zodResolver(reviewSchema), defaultValues: { verificationStatus: decision, note: "" } });
  const note = form.watch("note");

  const submit = form.handleSubmit(async (values) => {
    setError("");
    try {
      await review.mutateAsync({ loanReference: document.loan.reference, documentId: document.id, verificationStatus: values.verificationStatus, note: values.note.trim() || undefined });
      toast.success(`${documentTypeLabel(document.type)} ${values.verificationStatus === "verified" ? "verified" : values.verificationStatus === "rejected" ? "rejected" : "marked as needs review"}`);
      onDone();
    } catch (failureValue) {
      setError(failure(failureValue));
    }
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Controller control={form.control} name="note" render={({ field, fieldState }) => (
        <TextField value={field.value} onChange={(value) => field.onChange(value.slice(0, NOTE_LIMIT))} isInvalid={Boolean(fieldState.error)} isRequired={copy.required}>
          <Label>{copy.required ? "Reason (required)" : "Note (optional)"}</Label>
          <TextArea rows={3} placeholder={copy.placeholder} autoFocus />
          <Description className="text-right">{note.length}/{NOTE_LIMIT}</Description>
          <FieldError>{fieldState.error?.message}</FieldError>
        </TextField>
      )} />
      {error ? <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>Review was not saved</Alert.Title><Alert.Description>{error}</Alert.Description></Alert.Content></Alert> : null}
      <div className="flex gap-2">
        <Button type="button" variant="tertiary" className="min-h-11 flex-1" onPress={onBack}>Back</Button>
        <Button type="submit" variant={decision === "rejected" ? "danger" : "primary"} className="min-h-11 flex-[2]" isPending={form.formState.isSubmitting}>{copy.label}</Button>
      </div>
    </form>
  );
}

function Body({ document, onOpenLoan }: { document: ReviewDocumentDetail; onOpenLoan: (document: ReviewDocumentDetail) => void }) {
  const [decision, setDecision] = useState<DocumentDecision | null>(null);
  const FormatIcon = isPdf(document.mimeType) ? FilePdfIcon : ImageIcon;
  const history: ActivityItem[] = document.history.map((event, index, all) => ({
    id: `${event.kind}-${index}`,
    title: event.kind === "uploaded" ? "Uploaded" : event.status === "verified" ? "Verified" : event.status === "rejected" ? "Rejected" : "Marked needs review",
    detail: [event.by ? `by ${event.by}` : null, event.note].filter(Boolean).join(" — ") || (event.kind === "uploaded" ? "Submitted with the loan application." : undefined),
    time: `${fmtDateTime(event.at)} ICT`,
    state: event.status === "rejected" ? "failed" : index === all.length - 1 ? "current" : "done",
  }));

  return (
    <>
      <Drawer.Body className="space-y-5">
        <div className="adminTile flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-2xl text-center text-[var(--admin-muted)]">
          <FormatIcon size={44} weight="duotone" aria-hidden />
          <p className="px-6 text-sm">{isPdf(document.mimeType) ? "PDF document. Open it to read every page." : "Open the file to inspect the image."}</p>
          <a href={documentFileUrl(document.fileUrl)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[var(--admin-border)] bg-white px-3 text-sm font-bold text-[var(--admin-text)] outline-none hover:bg-[var(--admin-surface-muted)] focus-visible:ring-2 focus-visible:ring-[var(--admin-accent-strong)] md:min-h-9"><ArrowSquareOutIcon size={15} />Open Document</a>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div><dt className="text-[11px] text-[var(--admin-muted)]">Applicant</dt><dd className="font-semibold">{document.applicant.name}</dd></div>
          <div><dt className="text-[11px] text-[var(--admin-muted)]">Loan reference</dt><dd className="font-semibold">{document.loan.reference}</dd></div>
          <div><dt className="text-[11px] text-[var(--admin-muted)]">Document type</dt><dd className="font-semibold">{documentTypeLabel(document.type)}</dd></div>
          <div><dt className="text-[11px] text-[var(--admin-muted)]">Current status</dt><dd className="mt-0.5"><ReviewStatusBadge status={document.verificationStatus} /></dd></div>
          <div className="col-span-2"><dt className="text-[11px] text-[var(--admin-muted)]">Original filename</dt><dd className="break-all font-semibold">{document.originalFilename}</dd></div>
          <div className="col-span-2"><dt className="text-[11px] text-[var(--admin-muted)]">Uploaded</dt><dd className="font-semibold">{fmtDateTime(document.uploadedAt)} (Asia/Phnom_Penh)</dd></div>
        </dl>

        {decision ? <DecisionForm document={document} decision={decision} onBack={() => setDecision(null)} onDone={() => setDecision(null)} /> : null}

        <section aria-label="Review history"><h3 className="mb-3 text-sm font-extrabold">Review history</h3><ActivityTimeline items={history} /></section>
        <Button variant="ghost" className="min-h-11 text-[var(--admin-info)]" onPress={() => onOpenLoan(document)}>Open loan application<ArrowSquareOutIcon size={15} /></Button>
      </Drawer.Body>
      {decision ? null : (
        <Drawer.Footer className="flex flex-wrap gap-2">
          <Button variant="primary" className="min-h-11 flex-1" isDisabled={document.verificationStatus === "verified"} onPress={() => setDecision("verified")}><CheckCircleIcon size={17} />Verify</Button>
          <Button variant="outline" className="min-h-11 flex-1" isDisabled={document.verificationStatus === "needs_review"} onPress={() => setDecision("needs_review")}><WarningCircleIcon size={17} />Needs Review</Button>
          <Button variant="danger" className="min-h-11 flex-1" isDisabled={document.verificationStatus === "rejected"} onPress={() => setDecision("rejected")}><XCircleIcon size={17} />Reject</Button>
        </Drawer.Footer>
      )}
    </>
  );
}

export function DocumentReviewDrawer({ documentId, isOpen, onOpenChange, onOpenLoan }: { documentId: string | null; isOpen: boolean; onOpenChange: (open: boolean) => void; onOpenLoan: (document: { loan: { reference: string } }) => void }) {
  const query = useDocumentQuery(documentId);
  const document = query.data;
  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay">
      <Drawer.Content placement="right" className="w-full max-w-lg">
        <Drawer.Dialog aria-label="Review document">
          <Drawer.CloseTrigger />
          <Drawer.Header>{document ? <div className="flex items-center gap-3 pr-8"><DocumentTypeIcon type={document.type} /><Drawer.Heading>{documentTypeLabel(document.type)}</Drawer.Heading></div> : <Drawer.Heading>Document</Drawer.Heading>}</Drawer.Header>
          {document ? <Body key={`${document.id}-${document.verificationStatus}`} document={document} onOpenLoan={onOpenLoan} /> : query.isError ? <Drawer.Body><AdminErrorState title={query.error instanceof ApiError && query.error.status === 404 ? "Document not found" : "Couldn’t load the document"} description={failure(query.error)} onRetry={() => void query.refetch()} /></Drawer.Body> : <Drawer.Body><div role="status" aria-label="Loading document" className="h-48 animate-pulse rounded-2xl bg-[var(--admin-surface-muted)]" /></Drawer.Body>}
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
