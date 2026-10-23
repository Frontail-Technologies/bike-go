"use client";

import { AlertDialog, Button, Description, Label, ListBox, Modal, Select, TextArea, TextField } from "@heroui/react";
import { BellIcon, CalendarBlankIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { VehiclePhoto } from "@/components/admin/vehicles/vehicle-photo";
import { type Booking, type BookingStatus, bookingLabels, fmtShort, nextStatuses } from "./booking-data";
import { BookingStatusBadge } from "./booking-parts";

const NOTE_LIMIT = 500;

function Summary({ booking }: { booking: Booking }) {
  return (
    <div className="adminTile flex items-center gap-3 rounded-xl p-3">
      <VehiclePhoto vehicle={booking.vehicle} className="h-12 w-[68px] shrink-0 rounded-lg border border-[var(--admin-border)]" sizes="68px" />
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{booking.vehicle.name}</p><p className="truncate text-xs text-[var(--admin-muted)]">{booking.reference} · {booking.customer.name}</p></div>
      <BookingStatusBadge status={booking.status} />
    </div>
  );
}

function StatusForm({ booking, initial, onCancelBooking, onConfirm, onClose }: { booking: Booking; initial: BookingStatus | null; onCancelBooking: () => void; onConfirm: (status: BookingStatus, note: string) => void; onClose: () => void }) {
  const options = nextStatuses(booking.status);
  const [next, setNext] = useState<BookingStatus | null>(initial && options.includes(initial) ? initial : options[0] ?? null);
  const [note, setNote] = useState("");
  const cancelling = next === "cancelled";

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
            <TextField value={note} onChange={(value) => setNote(value.slice(0, NOTE_LIMIT))}>
              <Label>Add a note (optional)</Label>
              <TextArea rows={4} placeholder="e.g. Vehicle is ready for pickup. Please bring your ID." />
              <Description className="text-right">{note.length}/{NOTE_LIMIT}</Description>
            </TextField>
          </>
        ) : <p className="text-sm text-[var(--admin-muted)]">This booking is {bookingLabels[booking.status].toLowerCase()}, so its status can’t be changed.</p>}
      </Modal.Body>
      <Modal.Footer className="flex justify-end gap-2">
        <Button variant="tertiary" className="min-h-11" onPress={onClose}>Cancel</Button>
        <Button variant={cancelling ? "danger" : "primary"} className="min-h-11" isDisabled={!next} onPress={() => { if (!next) return; if (cancelling) onCancelBooking(); else onConfirm(next, note); }}>{cancelling ? "Continue to cancel" : "Update Status"}</Button>
      </Modal.Footer>
    </>
  );
}

export function UpdateStatusModal({ booking, initial, isOpen, onOpenChange, onCancelBooking, onConfirm }: { booking: Booking | null; initial: BookingStatus | null; isOpen: boolean; onOpenChange: (open: boolean) => void; onCancelBooking: (booking: Booking) => void; onConfirm: (booking: Booking, status: BookingStatus, note: string) => void }) {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay">
      <Modal.Container size="md">
        <Modal.Dialog aria-label="Update booking status">
          <Modal.CloseTrigger />
          <Modal.Header><Modal.Heading>Update Booking Status</Modal.Heading></Modal.Header>
          {booking ? <StatusForm key={`${booking.reference}-${initial ?? ""}`} booking={booking} initial={initial} onClose={() => onOpenChange(false)} onCancelBooking={() => { onOpenChange(false); onCancelBooking(booking); }} onConfirm={(status, note) => { onConfirm(booking, status, note); onOpenChange(false); }} /> : null}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function CancelForm({ booking, onConfirm }: { booking: Booking; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <>
      <AlertDialog.Body className="space-y-4">
        <p className="text-sm text-[var(--admin-muted)]">This booking will be cancelled and its vehicle released. The payment status isn’t changed automatically.</p>
        <Summary booking={booking} />
        <p className="flex items-center gap-2 text-xs text-[var(--admin-muted)]"><CalendarBlankIcon size={14} aria-hidden />{fmtShort(booking.pickupAt)} → {fmtShort(booking.returnAt)} (ICT)</p>
        <TextField value={reason} onChange={(value) => setReason(value.slice(0, NOTE_LIMIT))}>
          <Label>Cancellation reason</Label>
          <TextArea rows={3} placeholder="Why is this booking being cancelled?" />
          <Description className="text-right">{reason.length}/{NOTE_LIMIT}</Description>
        </TextField>
      </AlertDialog.Body>
      <AlertDialog.Footer>
        <Button variant="tertiary" slot="close" className="min-h-11">Keep Booking</Button>
        <Button variant="danger" slot="close" className="min-h-11" onPress={() => onConfirm(reason)}>Cancel Booking</Button>
      </AlertDialog.Footer>
    </>
  );
}

export function CancelBookingDialog({ booking, isOpen, onOpenChange, onConfirm }: { booking: Booking | null; isOpen: boolean; onOpenChange: (open: boolean) => void; onConfirm: (booking: Booking, reason: string) => void }) {
  return (
    <AlertDialog>
      <AlertDialog.Trigger className="hidden" aria-hidden="true">Open cancel dialog</AlertDialog.Trigger>
      <AlertDialog.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay">
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header><AlertDialog.Icon status="danger" /><AlertDialog.Heading>Cancel booking {booking?.reference}?</AlertDialog.Heading></AlertDialog.Header>
            {booking ? <CancelForm key={booking.reference} booking={booking} onConfirm={(reason) => onConfirm(booking, reason)} /> : null}
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}

