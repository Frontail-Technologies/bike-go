"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDialog, Button, Description, Drawer, FieldError, Label, ListBox, Modal, Select, Spinner, TextArea, TextField } from "@heroui/react";
import { useState } from "react";
import { Controller, useForm, type Control, type FieldPath } from "react-hook-form";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { LoanStatusBadge } from "@/components/admin/loans/loan-parts";
import { CurrencyAmount } from "@/components/admin/money";
import { cn } from "@/lib/cn";
import { loanActionError } from "../hooks/use-loan-actions";
import { documentTypeLabel, loanStatusLabels, loanTypeLabel, rejectionReasons, requiredDocumentTypes, reviewStatusOptions } from "../lib/loan-model";
import { approveSchema, rejectSchema, requestDocumentsSchema, statusUpdateSchema, type ApproveValues, type RejectValues, type RequestDocumentsValues, type StatusUpdateValues } from "../schemas/loan-schemas";
import type { Loan, LoanStatusInput, VerificationStatus } from "../types/loan";

const NOTE_LIMIT = 1000;

function Summary({ loan }: { loan: Loan }) {
  return (
    <div className="adminTile space-y-3 rounded-xl p-3">
      <div className="flex items-center gap-3"><CustomerAvatar name={loan.customer.name} size="sm" /><div className="min-w-0"><p className="truncate text-sm font-bold">{loan.customer.name}</p><p className="text-xs text-[var(--admin-muted)]">{loan.customer.reference} · {loan.reference}</p></div></div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[var(--admin-border)] pt-3 text-sm">
        <div><dt className="text-[11px] text-[var(--admin-muted)]">Loan type</dt><dd className="font-semibold">{loanTypeLabel(loan.loanType)}</dd></div>
        <div><dt className="text-[11px] text-[var(--admin-muted)]">Requested amount</dt><dd><CurrencyAmount amount={loan.requestedAmountMinor} currency={loan.currency} showCode /></dd></div>
        <div><dt className="text-[11px] text-[var(--admin-muted)]">Currency</dt><dd className="font-semibold">{loan.currency}</dd></div>
        <div><dt className="text-[11px] text-[var(--admin-muted)]">Tenure</dt><dd className="font-semibold">{loan.tenureMonths} months</dd></div>
      </dl>
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return message ? <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>Not saved</Alert.Title><Alert.Description>{message}</Alert.Description></Alert.Content></Alert> : null;
}

function NoteField<V extends StatusUpdateValues | ApproveValues | RejectValues | RequestDocumentsValues>({ control, name, label, placeholder, required = false }: { control: Control<V>; name: FieldPath<V>; label: string; placeholder?: string; required?: boolean }) {
  return (
    <Controller control={control} name={name} render={({ field, fieldState }) => (
      <TextField value={String(field.value ?? "")} onChange={(next) => field.onChange(next.slice(0, NOTE_LIMIT))} isInvalid={Boolean(fieldState.error)} isRequired={required}>
        <Label>{label}</Label>
        <TextArea rows={3} placeholder={placeholder} />
        <Description className="text-right">{String(field.value ?? "").length}/{NOTE_LIMIT}</Description>
        <FieldError>{fieldState.error?.message}</FieldError>
      </TextField>
    )} />
  );
}

type DialogProps = { loan: Loan | null; isOpen: boolean; onOpenChange: (open: boolean) => void; onConfirm: (loan: Loan, input: LoanStatusInput) => Promise<unknown> };

/** Runs a form's submit against the backend: the dialog closes on success and shows the backend's message otherwise. */
function useSubmit(close: () => void) {
  const [error, setError] = useState("");
  return {
    error,
    run: async (action: () => Promise<unknown>) => {
      setError("");
      try {
        await action();
        close();
      } catch (failure) {
        setError(loanActionError(failure));
      }
    },
  };
}

function StatusForm({ loan, onClose, onConfirm }: { loan: Loan; onClose: () => void; onConfirm: DialogProps["onConfirm"] }) {
  const options = reviewStatusOptions(loan) as StatusUpdateValues["status"][];
  const { error, run } = useSubmit(onClose);
  const form = useForm<StatusUpdateValues>({ resolver: zodResolver(statusUpdateSchema), defaultValues: { status: options[0] ?? "documents_under_review", note: "" } });
  const submit = form.handleSubmit((values) => run(() => onConfirm(loan, { status: values.status, ...(values.note.trim() ? { note: values.note.trim() } : {}) })));

  return (
    <form onSubmit={submit} noValidate className="contents">
      <Modal.Body className="space-y-4">
        <Summary loan={loan} />
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--admin-border)] p-3"><span className="text-sm font-semibold text-[var(--admin-muted)]">Current status</span><LoanStatusBadge status={loan.status} /></div>
        {options.length ? (
          <Controller control={form.control} name="status" render={({ field }) => (
            <Select name="application-status" value={field.value} onChange={(key) => key !== null && field.onChange(String(key))} isRequired>
              <Label>New status</Label>
              <Select.Trigger className="min-h-11"><Select.Value /><Select.Indicator /></Select.Trigger>
              <Select.Popover className="adminOverlay"><ListBox>{options.map((status) => <ListBox.Item key={status} id={status} textValue={loanStatusLabels[status]}>{loanStatusLabels[status]}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
            </Select>
          )} />
        ) : <p className="text-sm text-[var(--admin-muted)]">There is no further review step available from {loanStatusLabels[loan.status].toLowerCase()}.</p>}
        <NoteField control={form.control} name="note" label="Status note (optional)" placeholder="Add context for this review stage. The applicant can see it." />
        <ErrorAlert message={error} />
      </Modal.Body>
      <Modal.Footer className="flex justify-end gap-2">
        <Button type="button" variant="tertiary" className="min-h-11" onPress={onClose}>Cancel</Button>
        <Button type="submit" variant="primary" className="min-h-11" isDisabled={!options.length} isPending={form.formState.isSubmitting}>{form.formState.isSubmitting ? <Spinner aria-hidden="true" color="current" size="sm" /> : null}Update Status</Button>
      </Modal.Footer>
    </form>
  );
}

export function UpdateLoanStatusModal({ loan, isOpen, onOpenChange, onConfirm }: DialogProps) {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay">
      <Modal.Container size="md">
        <Modal.Dialog aria-label="Update application status">
          <Modal.CloseTrigger />
          <Modal.Header><Modal.Heading>Update Application Status</Modal.Heading></Modal.Header>
          {loan ? <StatusForm key={`${loan.reference}-${loan.status}`} loan={loan} onClose={() => onOpenChange(false)} onConfirm={onConfirm} /> : null}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

const verificationHint: Record<VerificationStatus, string> = { uploaded: "uploaded", verified: "verified", needs_review: "needs review", rejected: "rejected" };

function RequestForm({ loan, onClose, onConfirm }: { loan: Loan; onClose: () => void; onConfirm: DialogProps["onConfirm"] }) {
  const { error, run } = useSubmit(onClose);
  const latest = (type: string) => loan.documents.filter((doc) => doc.type === type).at(-1);
  // Start from what is missing or was sent back; verified and freshly uploaded documents are left alone.
  const initial = requiredDocumentTypes.filter((type) => { const doc = latest(type); return !doc || doc.verificationStatus === "needs_review" || doc.verificationStatus === "rejected"; });
  const form = useForm<RequestDocumentsValues>({ resolver: zodResolver(requestDocumentsSchema), defaultValues: { types: [...initial], message: "" } });
  const selected = form.watch("types");
  const toggle = (type: string) => form.setValue("types", selected.includes(type) ? selected.filter((item) => item !== type) : [...selected, type], { shouldValidate: true });
  const submit = form.handleSubmit((values) => {
    const requestedTypes = requiredDocumentTypes.filter((type) => values.types.includes(type));
    const list = requestedTypes.map((type) => documentTypeLabel(type)).join(", ");
    const message = values.message.trim();
    return run(() => onConfirm(loan, { status: "additional_documents_required", requestedDocumentTypes: [...requestedTypes], note: `Please upload: ${list}.${message ? ` ${message}` : ""}` }));
  });

  return (
    <form onSubmit={submit} noValidate className="contents">
      <Drawer.Body className="space-y-5">
        <div className="adminTile rounded-xl p-3"><p className="text-sm font-bold">{loan.customer.name}</p><p className="text-xs text-[var(--admin-muted)]">Application {loan.reference}</p></div>
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-bold">Required documents</legend>
          {requiredDocumentTypes.map((type) => {
            const checked = selected.includes(type);
            const doc = latest(type);
            return (
              <label key={type} className={cn("flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-[var(--admin-accent-strong)]", checked ? "border-[var(--admin-accent-strong)] bg-[var(--admin-accent-soft)]" : "border-[var(--admin-border)] bg-white hover:border-[var(--admin-border-strong)]")}>
                <input type="checkbox" checked={checked} onChange={() => toggle(type)} className="size-4 accent-[#dcae00]" />
                <span className="min-w-0 flex-1 text-sm font-semibold">{documentTypeLabel(type)}</span>
                <span className="text-[11px] text-[var(--admin-muted)]">{doc ? verificationHint[doc.verificationStatus] : "missing"}</span>
              </label>
            );
          })}
          {form.formState.errors.types ? <p role="alert" className="text-xs font-semibold text-[var(--admin-danger)]">{form.formState.errors.types.message}</p> : null}
        </fieldset>
        <NoteField control={form.control} name="message" label="Message to applicant (optional)" placeholder="Please upload a clearer bank statement for the latest 3 months." />
        <p className="text-xs text-[var(--admin-muted)]">The application moves to “Additional documents required” and the applicant sees this request.</p>
        <ErrorAlert message={error} />
      </Drawer.Body>
      <Drawer.Footer className="grid grid-cols-2 gap-2">
        <Button type="button" variant="tertiary" className="min-h-11" onPress={onClose}>Cancel</Button>
        <Button type="submit" variant="primary" className="min-h-11" isPending={form.formState.isSubmitting}>{form.formState.isSubmitting ? <Spinner aria-hidden="true" color="current" size="sm" /> : null}Request Documents</Button>
      </Drawer.Footer>
    </form>
  );
}

export function RequestDocumentsDrawer({ loan, isOpen, onOpenChange, onConfirm }: DialogProps) {
  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay">
      <Drawer.Content placement="right" className="w-full max-w-md">
        <Drawer.Dialog aria-label="Request additional documents">
          <Drawer.CloseTrigger />
          <Drawer.Header><Drawer.Heading>Request additional documents</Drawer.Heading></Drawer.Header>
          {loan ? <RequestForm key={loan.reference} loan={loan} onClose={() => onOpenChange(false)} onConfirm={onConfirm} /> : null}
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}

function ApproveBody({ loan, onClose, onConfirm }: { loan: Loan; onClose: () => void; onConfirm: DialogProps["onConfirm"] }) {
  const { error, run } = useSubmit(onClose);
  const form = useForm<ApproveValues>({ resolver: zodResolver(approveSchema), defaultValues: { note: "" } });
  const submit = form.handleSubmit((values) => run(() => onConfirm(loan, { status: "approved", ...(values.note.trim() ? { note: values.note.trim() } : {}) })));
  return (
    <form onSubmit={submit} noValidate className="contents">
      <AlertDialog.Body className="space-y-4">
        <p className="text-sm text-[var(--admin-muted)]">Approving moves this application to Approved. It is a manual decision; nothing is scored or generated automatically.</p>
        <Summary loan={loan} />
        <NoteField control={form.control} name="note" label="Admin note (optional)" />
        <ErrorAlert message={error} />
      </AlertDialog.Body>
      <AlertDialog.Footer>
        <Button type="button" variant="tertiary" className="min-h-11" onPress={onClose}>Cancel</Button>
        <Button type="submit" variant="primary" className="min-h-11" isPending={form.formState.isSubmitting}>{form.formState.isSubmitting ? <Spinner aria-hidden="true" color="current" size="sm" /> : null}Approve Application</Button>
      </AlertDialog.Footer>
    </form>
  );
}

export function ApproveLoanDialog({ loan, isOpen, onOpenChange, onConfirm }: DialogProps) {
  return (
    <AlertDialog>
      <AlertDialog.Trigger className="hidden" aria-hidden="true">Open approve dialog</AlertDialog.Trigger>
      <AlertDialog.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay">
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header><AlertDialog.Icon status="accent" /><AlertDialog.Heading>Approve loan application?</AlertDialog.Heading></AlertDialog.Header>
            {loan ? <ApproveBody key={loan.reference} loan={loan} onClose={() => onOpenChange(false)} onConfirm={onConfirm} /> : null}
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}

function RejectBody({ loan, onClose, onConfirm }: { loan: Loan; onClose: () => void; onConfirm: DialogProps["onConfirm"] }) {
  const { error, run } = useSubmit(onClose);
  const form = useForm<RejectValues>({ resolver: zodResolver(rejectSchema), defaultValues: { note: "" } });
  const submit = form.handleSubmit((values) => run(() => onConfirm(loan, { status: "rejected", note: [values.reason, values.note.trim()].filter(Boolean).join(" — ") })));
  return (
    <form onSubmit={submit} noValidate className="contents">
      <AlertDialog.Body className="space-y-4">
        <p className="text-sm text-[var(--admin-muted)]">The application will be marked Rejected. The reason is saved to its history and the applicant can see it.</p>
        <Summary loan={loan} />
        <Controller control={form.control} name="reason" render={({ field, fieldState }) => (
          <Select name="reason" value={field.value ?? null} onChange={(key) => key !== null && field.onChange(String(key))} isInvalid={Boolean(fieldState.error)} isRequired>
            <Label>Rejection reason</Label>
            <Select.Trigger className="min-h-11"><Select.Value /><Select.Indicator /></Select.Trigger>
            <Select.Popover className="adminOverlay"><ListBox>{rejectionReasons.map((value) => <ListBox.Item key={value} id={value} textValue={value}>{value}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
            <FieldError>{fieldState.error?.message}</FieldError>
          </Select>
        )} />
        <NoteField control={form.control} name="note" label="Additional note (optional)" />
        <ErrorAlert message={error} />
      </AlertDialog.Body>
      <AlertDialog.Footer>
        <Button type="button" variant="tertiary" className="min-h-11" onPress={onClose}>Keep Application</Button>
        <Button type="submit" variant="danger" className="min-h-11" isPending={form.formState.isSubmitting}>{form.formState.isSubmitting ? <Spinner aria-hidden="true" color="current" size="sm" /> : null}Reject Application</Button>
      </AlertDialog.Footer>
    </form>
  );
}

export function RejectLoanDialog({ loan, isOpen, onOpenChange, onConfirm }: DialogProps) {
  return (
    <AlertDialog>
      <AlertDialog.Trigger className="hidden" aria-hidden="true">Open reject dialog</AlertDialog.Trigger>
      <AlertDialog.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay">
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header><AlertDialog.Icon status="danger" /><AlertDialog.Heading>Reject loan application?</AlertDialog.Heading></AlertDialog.Header>
            {loan ? <RejectBody key={loan.reference} loan={loan} onClose={() => onOpenChange(false)} onConfirm={onConfirm} /> : null}
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
