"use client";

import { Alert, AlertDialog, Button, Description, FieldError, Label, ListBox, Modal, Select, TextArea, TextField } from "@heroui/react";
import { BellIcon, CalendarBlankIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { BookingStatusBadge } from "@/components/admin/bookings/booking-parts";
import { VehiclePhoto } from "@/components/admin/vehicles/vehicle-photo";
import { actionErrorMessage } from "../hooks/use-booking-actions";
import { bookingLabels, canMoveTo, fmtShort, vehiclePhoto } from "../lib/booking-model";
import { noteSchema } from "../schemas/booking-schemas";
import type { Booking, BookingStatus } from "../types/booking";

const NOTE_LIMIT = 300;

function Summary({ booking }: { booking: Booking }) {
  return (
    <div className="adminTile flex items-center gap-3 rounded-xl p-3">
      <VehiclePhoto vehicle={vehiclePhoto(booking.vehicle)} className="h-12 w-[68px] shrink-0 rounded-lg border border-[var(--admin-border)]" sizes="68px" />
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{booking.vehicle.name}</p><p className="truncate text-xs text-[var(--admin-muted)]">{booking.reference} · {booking.customer.name}</p></div>
      <BookingStatusBadge status={booking.bookingStatus} />
    </div>
  );
}

function ErrorAlert({ title, message }: { title: string; message: string }) {
  return message ? <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>{title}</Alert.Title><Alert.Description>{message}</Alert.Description></Alert.Content></Alert> : null;
}

/** Runs a confirm action, keeps the dialog open with the backend's message on failure and closes it on success. */
function useConfirm(onDone: () => void) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function run(action: () => Promise<unknown>) {
    setPending(true);
    setError("");
    try {
      await action();
      onDone();
    } catch (failure) {
      setError(actionErrorMessage(failure));
    } finally {
      setPending(false);
    }
  }
  return { pending, error, run };
}

function NoteField({ label, placeholder, value, onChange, error }: { label: string; placeholder: string; value: string; onChange: (value: string) => void; error?: string }) {
  return (
    <TextField value={value} onChange={(next) => onChange(next.slice(0, NOTE_LIMIT))} isInvalid={Boolean(error)}>
      <Label>{label}</Label>
      <TextArea rows={3} placeholder={placeholder} />
      <Description className="text-right">{value.length}/{NOTE_LIMIT}</Description>
      <FieldError>{error}</FieldError>
    </TextField>
  );
}

const validateNote = (value: string) => {
  const result = noteSchema.safeParse(value);
  return result.success ? { note: result.data } : { error: result.error.issues[0]?.message ?? "Check the note." };
};

function StatusForm({ booking, initial, onConfirm, onClose }: { booking: Booking; initial: BookingStatus | null; onConfirm: (status: BookingStatus, note: string) => Promise<unknown>; onClose: () => void }) {
  const options = (["confirmed", "ready_for_pickup"] as const).filter((status) => canMoveTo(booking, status));
  const [next, setNext] = useState<BookingStatus | null>(initial && (options as readonly string[]).includes(initial) ? initial : options[0] ?? null);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const { pending, error, run } = useConfirm(onClose);

  function submit() {
    if (!next) return;
    const checked = validateNote(note);
    if ("error" in checked) { setNoteError(checked.error ?? ""); return; }
    void run(() => onConfirm(next, checked.note));
  }

  return (
    <>
      <Modal.Body className="space-y-4">
        <Summary booking={booking} />
        {options.length ? (
          <>
            <Select name="status" value={next} onChange={(key) => key !== null && setNext(String(key) as BookingStatus)}>
              <Label>New status</Label>
              <Select.Trigger className="min-h-11"><Select.Value /><Select.Indicator /></Select.Trigger>
              <Select.Popover className="adminOverlay"><ListBox>{options.map((value) => <ListBox.Item key={value} id={value} textValue={bookingLabels[value]}>{bookingLabels[value]}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
            </Select>
            <div className="flex items-start gap-2 rounded-xl bg-[var(--admin-info-soft)] p-3 text-xs font-medium text-[var(--admin-info)]"><BellIcon size={16} className="mt-0.5 shrink-0" aria-hidden />The customer may be notified when this status changes.</div>
            <NoteField label="Add a note (optional)" placeholder="e.g. Vehicle is ready for pickup. Please bring your ID." value={note} onChange={(value) => { setNote(value); setNoteError(""); }} error={noteError} />
          </>
        ) : <p className="text-sm text-[var(--admin-muted)]">This booking is {bookingLabels[booking.bookingStatus].toLowerCase()}, so its status can’t be changed here.</p>}
        <ErrorAlert title="Status was not updated" message={error} />
      </Modal.Body>
      <Modal.Footer className="flex justify-end gap-2">
        <Button variant="tertiary" className="min-h-11" onPress={onClose}>Cancel</Button>
        <Button variant="primary" className="min-h-11" isDisabled={!next} isPending={pending} onPress={submit}>Update Status</Button>
      </Modal.Footer>
    </>
  );
}

export function UpdateStatusModal({ booking, initial, isOpen, onOpenChange, onConfirm }: { booking: Booking | null; initial: BookingStatus | null; isOpen: boolean; onOpenChange: (open: boolean) => void; onConfirm: (booking: Booking, status: BookingStatus, note: string) => Promise<unknown> }) {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay">
      <Modal.Container size="md">
        <Modal.Dialog aria-label="Update booking status">
          <Modal.CloseTrigger />
          <Modal.Header><Modal.Heading>Update Booking Status</Modal.Heading></Modal.Header>
          {booking ? <StatusForm key={`${booking.reference}-${initial ?? ""}`} booking={booking} initial={initial} onClose={() => onOpenChange(false)} onConfirm={(status, note) => onConfirm(booking, status, note)} /> : null}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function ReasonForm({ booking, intro, label, placeholder, keepLabel, confirmLabel, summary, onConfirm, onClose }: { booking: Booking; intro: string; label: string; placeholder: string; keepLabel: string; confirmLabel: string; summary?: boolean; onConfirm: (reason: string) => Promise<unknown>; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const { pending, error, run } = useConfirm(onClose);

  function submit() {
    const checked = validateNote(reason);
    if ("error" in checked) { setReasonError(checked.error ?? ""); return; }
    void run(() => onConfirm(checked.note));
  }

  return (
    <>
      <AlertDialog.Body className="space-y-4">
        <p className="text-sm text-[var(--admin-muted)]">{intro}</p>
        <Summary booking={booking} />
        {summary ? <p className="flex items-center gap-2 text-xs text-[var(--admin-muted)]"><CalendarBlankIcon size={14} aria-hidden />{fmtShort(booking.pickupAt)} → {fmtShort(booking.returnAt)} (ICT)</p> : null}
        <NoteField label={label} placeholder={placeholder} value={reason} onChange={(value) => { setReason(value); setReasonError(""); }} error={reasonError} />
        <ErrorAlert title="Not saved" message={error} />
      </AlertDialog.Body>
      <AlertDialog.Footer>
        <Button variant="tertiary" className="min-h-11" onPress={onClose}>{keepLabel}</Button>
        <Button variant="danger" className="min-h-11" isPending={pending} onPress={submit}>{confirmLabel}</Button>
      </AlertDialog.Footer>
    </>
  );
}

type ReasonDialogProps = { booking: Booking | null; isOpen: boolean; onOpenChange: (open: boolean) => void; onConfirm: (booking: Booking, reason: string) => Promise<unknown> };

export function CancelBookingDialog({ booking, isOpen, onOpenChange, onConfirm }: ReasonDialogProps) {
  return (
    <AlertDialog>
      <AlertDialog.Trigger className="hidden" aria-hidden="true">Open cancel dialog</AlertDialog.Trigger>
      <AlertDialog.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay">
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header><AlertDialog.Icon status="danger" /><AlertDialog.Heading>Cancel booking {booking?.reference}?</AlertDialog.Heading></AlertDialog.Header>
            {booking ? <ReasonForm key={booking.reference} booking={booking} summary intro="This booking will be cancelled and its vehicle released. The payment status isn’t changed automatically." label="Cancellation reason" placeholder="Why is this booking being cancelled?" keepLabel="Keep Booking" confirmLabel="Cancel Booking" onClose={() => onOpenChange(false)} onConfirm={(reason) => onConfirm(booking, reason)} /> : null}
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}

export function NoShowDialog({ booking, isOpen, onOpenChange, onConfirm }: ReasonDialogProps) {
  return (
    <AlertDialog>
      <AlertDialog.Trigger className="hidden" aria-hidden="true">Open no-show dialog</AlertDialog.Trigger>
      <AlertDialog.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay">
        <AlertDialog.Container><AlertDialog.Dialog>
          <AlertDialog.Header><AlertDialog.Icon status="warning" /><AlertDialog.Heading>Mark {booking?.reference} as No Show?</AlertDialog.Heading></AlertDialog.Header>
          {booking ? <ReasonForm key={booking.reference} booking={booking} intro="Use this only when the scheduled pickup has passed and the customer did not arrive. It can’t be reversed, and the payment status isn’t changed automatically." label="Note (optional)" placeholder="e.g. Customer did not answer calls." keepLabel="Keep Booking" confirmLabel="Mark No Show" onClose={() => onOpenChange(false)} onConfirm={(reason) => onConfirm(booking, reason)} /> : null}
        </AlertDialog.Dialog></AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
