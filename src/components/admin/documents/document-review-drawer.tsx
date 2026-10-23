"use client";

import { Button, Description, Drawer, Label, TextArea, TextField } from "@heroui/react";
import { ArrowSquareOutIcon, CheckCircleIcon, FilePdfIcon, ImageIcon, WarningCircleIcon, XCircleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { ActivityTimeline, type ActivityItem } from "@/components/admin/data-display/misc";
import { type ReviewDocument, type ReviewStatus, fmtDateTime } from "./document-data";
import { DocumentTypeIcon, ReviewStatusBadge } from "./document-parts";

const NOTE_LIMIT = 300;
type Decision = Exclude<ReviewStatus, "uploaded">;
const decisionCopy: Record<Decision, { label: string; placeholder: string; required: boolean }> = {
  verified: { label: "Verify document", placeholder: "Optional note", required: false },
  "needs-review": { label: "Mark as needs review", placeholder: "What should be checked again?", required: true },
  rejected: { label: "Reject document", placeholder: "Image is blurred. Please upload a clearer passport copy.", required: true },
};

function Body({ document, onReview, onOpenLoan, onClose }: { document: ReviewDocument; onReview: (document: ReviewDocument, status: Decision, note: string) => void; onOpenLoan: (document: ReviewDocument) => void; onClose: () => void }) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);
  const copy = decision ? decisionCopy[decision] : null;
  const invalid = Boolean(copy?.required && !note.trim());
  const history: ActivityItem[] = document.history.map((event, index, all) => ({ id: event.id, title: event.title, detail: event.detail, time: `${fmtDateTime(event.at)} ICT`, state: event.title === "Rejected" ? "failed" : index === all.length - 1 ? "current" : "done" }));
  const FormatIcon = document.format === "pdf" ? FilePdfIcon : ImageIcon;

  function confirm() {
    if (!decision) return;
    setTouched(true);
    if (invalid) return;
    onReview(document, decision, note.trim());
    onClose();
  }

  return (
    <>
      <Drawer.Body className="space-y-5">
        <div className="adminTile flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-2xl text-center text-[var(--admin-muted)]">
          <FormatIcon size={44} weight="duotone" aria-hidden />
          <p className="px-6 text-sm">{document.format === "pdf" ? "PDF document. Open it to read every page." : "Image preview isn’t available in this demo."}</p>
          <Button size="sm" variant="outline" className="min-h-11 md:min-h-9"><ArrowSquareOutIcon size={15} />Open Document</Button>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div><dt className="text-[11px] text-[var(--admin-muted)]">Applicant</dt><dd className="font-semibold">{document.applicant.name}</dd></div>
          <div><dt className="text-[11px] text-[var(--admin-muted)]">Loan reference</dt><dd className="font-semibold">{document.loanReference}</dd></div>
          <div><dt className="text-[11px] text-[var(--admin-muted)]">Document type</dt><dd className="flex items-center gap-1.5 font-semibold">{document.type}</dd></div>
          <div><dt className="text-[11px] text-[var(--admin-muted)]">Current status</dt><dd className="mt-0.5"><ReviewStatusBadge status={document.status} /></dd></div>
          <div className="col-span-2"><dt className="text-[11px] text-[var(--admin-muted)]">Original filename</dt><dd className="break-all font-semibold">{document.fileName}</dd></div>
          <div className="col-span-2"><dt className="text-[11px] text-[var(--admin-muted)]">Uploaded</dt><dd className="font-semibold">{fmtDateTime(document.uploadedAt)} (Asia/Phnom_Penh)</dd></div>
        </dl>

        {decision && copy ? (
          <TextField value={note} onChange={(value) => setNote(value.slice(0, NOTE_LIMIT))} isInvalid={touched && invalid} isRequired={copy.required}>
            <Label>{copy.required ? "Reason (required)" : "Note (optional)"}</Label>
            <TextArea rows={3} placeholder={copy.placeholder} autoFocus />
            <Description className="text-right">{note.length}/{NOTE_LIMIT}</Description>
            {touched && invalid ? <p role="alert" className="text-sm font-semibold text-[var(--admin-danger)]">Add a reason so the applicant knows what to fix.</p> : null}
          </TextField>
        ) : null}

        <section aria-label="Review history"><h3 className="mb-3 text-sm font-extrabold">Review history</h3><ActivityTimeline items={history} /></section>
        <Button variant="ghost" className="min-h-11 text-[var(--admin-info)]" onPress={() => onOpenLoan(document)}>Open loan application<ArrowSquareOutIcon size={15} /></Button>
      </Drawer.Body>
      <Drawer.Footer className="flex flex-wrap gap-2">
        {decision ? (
          <>
            <Button variant="tertiary" className="min-h-11 flex-1" onPress={() => { setDecision(null); setNote(""); setTouched(false); }}>Back</Button>
            <Button variant={decision === "rejected" ? "danger" : "primary"} className="min-h-11 flex-[2]" onPress={confirm}>{copy?.label}</Button>
          </>
        ) : (
          <>
            <Button variant="primary" className="min-h-11 flex-1" isDisabled={document.status === "verified"} onPress={() => setDecision("verified")}><CheckCircleIcon size={17} />Verify</Button>
            <Button variant="outline" className="min-h-11 flex-1" isDisabled={document.status === "needs-review"} onPress={() => setDecision("needs-review")}><WarningCircleIcon size={17} />Needs Review</Button>
            <Button variant="danger" className="min-h-11 flex-1" isDisabled={document.status === "rejected"} onPress={() => setDecision("rejected")}><XCircleIcon size={17} />Reject</Button>
          </>
        )}
      </Drawer.Footer>
    </>
  );
}

export function DocumentReviewDrawer({ document, isOpen, onOpenChange, onReview, onOpenLoan }: { document: ReviewDocument | null; isOpen: boolean; onOpenChange: (open: boolean) => void; onReview: (document: ReviewDocument, status: Decision, note: string) => void; onOpenLoan: (document: ReviewDocument) => void }) {
  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay">
      <Drawer.Content placement="right" className="w-full max-w-lg">
        <Drawer.Dialog aria-label="Review document">
          <Drawer.CloseTrigger />
          <Drawer.Header>{document ? <div className="flex items-center gap-3 pr-8"><DocumentTypeIcon type={document.type} /><Drawer.Heading>{document.type}</Drawer.Heading></div> : <Drawer.Heading>Document</Drawer.Heading>}</Drawer.Header>
          {document ? <Body key={`${document.id}-${document.status}`} document={document} onReview={onReview} onOpenLoan={onOpenLoan} onClose={() => onOpenChange(false)} /> : null}
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
