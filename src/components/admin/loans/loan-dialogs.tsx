"use client";

import { AlertDialog, Button, Description, Drawer, Label, ListBox, Select, TextArea, TextField } from "@heroui/react";
import { useState } from "react";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { CurrencyAmount } from "@/components/admin/money";
import { cn } from "@/lib/cn";
import { type DocumentType, documentTypes, type Loan, rejectionReasons } from "./loan-data";

const NOTE_LIMIT = 500;

function Summary({ loan }: { loan: Loan }) {
  return (
    <div className="adminTile space-y-3 rounded-xl p-3">
      <div className="flex items-center gap-3"><CustomerAvatar name={loan.applicant.name} size="sm" /><div className="min-w-0"><p className="truncate text-sm font-bold">{loan.applicant.name}</p><p className="text-xs text-[var(--admin-muted)]">{loan.applicant.customerReference} · {loan.reference}</p></div></div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[var(--admin-border)] pt-3 text-sm">
        <div><dt className="text-[11px] text-[var(--admin-muted)]">Loan type</dt><dd className="font-semibold">{loan.loanType}</dd></div>
        <div><dt className="text-[11px] text-[var(--admin-muted)]">Requested amount</dt><dd><CurrencyAmount amount={loan.requestedMinor} currency={loan.currency} showCode /></dd></div>
        <div><dt className="text-[11px] text-[var(--admin-muted)]">Currency</dt><dd className="font-semibold">{loan.currency}</dd></div>
        <div><dt className="text-[11px] text-[var(--admin-muted)]">Tenure</dt><dd className="font-semibold">{loan.tenureMonths} months</dd></div>
      </dl>
    </div>
  );
}

function NoteField({ value, onChange, label = "Admin note (optional)", placeholder }: { value: string; onChange: (value: string) => void; label?: string; placeholder?: string }) {
  return (
    <TextField value={value} onChange={(next) => onChange(next.slice(0, NOTE_LIMIT))}>
      <Label>{label}</Label>
      <TextArea rows={3} placeholder={placeholder} />
      <Description className="text-right">{value.length}/{NOTE_LIMIT}</Description>
    </TextField>
  );
}

function RequestForm({ loan, onClose, onConfirm }: { loan: Loan; onClose: () => void; onConfirm: (types: DocumentType[], note: string) => void }) {
  const [selected, setSelected] = useState<DocumentType[]>(() => loan.documents.filter((doc) => doc.status !== "verified" && doc.status !== "uploaded").map((doc) => doc.type));
  const [note, setNote] = useState("");
  const toggle = (type: DocumentType) => setSelected((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type]);
  return (
    <>
      <Drawer.Body className="space-y-5">
        <div className="adminTile rounded-xl p-3"><p className="text-sm font-bold">{loan.applicant.name}</p><p className="text-xs text-[var(--admin-muted)]">Application {loan.reference}</p></div>
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-bold">Required documents</legend>
          {documentTypes.map((type) => {
            const checked = selected.includes(type);
            const status = loan.documents.find((doc) => doc.type === type)?.status;
            return (
              <label key={type} className={cn("flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-[var(--admin-accent-strong)]", checked ? "border-[var(--admin-accent-strong)] bg-[var(--admin-accent-soft)]" : "border-[var(--admin-border)] bg-white hover:border-[var(--admin-border-strong)]")}>
                <input type="checkbox" checked={checked} onChange={() => toggle(type)} className="size-4 accent-[#dcae00]" />
                <span className="min-w-0 flex-1 text-sm font-semibold">{type}</span>
                {status ? <span className="text-[11px] capitalize text-[var(--admin-muted)]">{status.replace("-", " ")}</span> : null}
              </label>
            );
          })}
        </fieldset>
        <NoteField value={note} onChange={setNote} label="Message to applicant (optional)" placeholder="Please upload a clearer bank statement for the latest 3 months." />
        <p className="text-xs text-[var(--admin-muted)]">Demo only — nothing is sent. The application moves to “Additional documents required” in this preview.</p>
      </Drawer.Body>
      <Drawer.Footer className="grid grid-cols-2 gap-2">
        <Button type="button" variant="tertiary" className="min-h-11" onPress={onClose}>Cancel</Button>
        <Button variant="primary" className="min-h-11" isDisabled={!selected.length} onPress={() => onConfirm(selected, note)}>Request Documents</Button>
      </Drawer.Footer>
    </>
  );
}

export function RequestDocumentsDrawer({ loan, isOpen, onOpenChange, onConfirm }: { loan: Loan | null; isOpen: boolean; onOpenChange: (open: boolean) => void; onConfirm: (loan: Loan, types: DocumentType[], note: string) => void }) {
  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay">
      <Drawer.Content placement="right" className="w-full max-w-md">
        <Drawer.Dialog aria-label="Request additional documents">
          <Drawer.CloseTrigger />
          <Drawer.Header><Drawer.Heading>Request additional documents</Drawer.Heading></Drawer.Header>
          {loan ? <RequestForm key={loan.reference} loan={loan} onClose={() => onOpenChange(false)} onConfirm={(types, note) => { onConfirm(loan, types, note); onOpenChange(false); }} /> : null}
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}

function ApproveBody({ loan, onConfirm }: { loan: Loan; onConfirm: (note: string) => void }) {
  const [note, setNote] = useState("");
  return (
    <>
      <AlertDialog.Body className="space-y-4">
        <p className="text-sm text-[var(--admin-muted)]">Approving moves this application to Approved and notifies the customer of the decision.</p>
        <Summary loan={loan} />
        <NoteField value={note} onChange={setNote} />
      </AlertDialog.Body>
      <AlertDialog.Footer>
        <Button variant="tertiary" slot="close" className="min-h-11">Cancel</Button>
        <Button variant="primary" slot="close" className="min-h-11" onPress={() => onConfirm(note)}>Approve Application</Button>
      </AlertDialog.Footer>
    </>
  );
}

export function ApproveLoanDialog({ loan, isOpen, onOpenChange, onConfirm }: { loan: Loan | null; isOpen: boolean; onOpenChange: (open: boolean) => void; onConfirm: (loan: Loan, note: string) => void }) {
  return (
    <AlertDialog>
      <AlertDialog.Trigger className="hidden" aria-hidden="true">Open approve dialog</AlertDialog.Trigger>
      <AlertDialog.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay">
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header><AlertDialog.Icon status="accent" /><AlertDialog.Heading>Approve loan application?</AlertDialog.Heading></AlertDialog.Header>
            {loan ? <ApproveBody key={loan.reference} loan={loan} onConfirm={(note) => onConfirm(loan, note)} /> : null}
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}

function RejectBody({ loan, onConfirm }: { loan: Loan; onConfirm: (reason: string, note: string) => void }) {
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState("");
  return (
    <>
      <AlertDialog.Body className="space-y-4">
        <p className="text-sm text-[var(--admin-muted)]">The application will be marked Rejected and the customer will be notified.</p>
        <Summary loan={loan} />
        <Select name="reason" value={reason} onChange={(key) => key !== null && setReason(String(key))} isRequired>
          <Label>Rejection reason</Label>
          <Select.Trigger className="min-h-11"><Select.Value /><Select.Indicator /></Select.Trigger>
          <Select.Popover className="adminOverlay"><ListBox>{rejectionReasons.map((value) => <ListBox.Item key={value} id={value} textValue={value}>{value}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
        </Select>
        <NoteField value={note} onChange={setNote} />
      </AlertDialog.Body>
      <AlertDialog.Footer>
        <Button variant="tertiary" slot="close" className="min-h-11">Keep Application</Button>
        <Button variant="danger" slot="close" className="min-h-11" isDisabled={!reason} onPress={() => reason && onConfirm(reason, note)}>Reject Application</Button>
      </AlertDialog.Footer>
    </>
  );
}

export function RejectLoanDialog({ loan, isOpen, onOpenChange, onConfirm }: { loan: Loan | null; isOpen: boolean; onOpenChange: (open: boolean) => void; onConfirm: (loan: Loan, reason: string, note: string) => void }) {
  return (
    <AlertDialog>
      <AlertDialog.Trigger className="hidden" aria-hidden="true">Open reject dialog</AlertDialog.Trigger>
      <AlertDialog.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay">
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header><AlertDialog.Icon status="danger" /><AlertDialog.Heading>Reject loan application?</AlertDialog.Heading></AlertDialog.Header>
            {loan ? <RejectBody key={loan.reference} loan={loan} onConfirm={(reason, note) => onConfirm(loan, reason, note)} /> : null}
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
