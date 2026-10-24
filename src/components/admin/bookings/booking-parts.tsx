"use client";

import { Button, Dropdown, Label } from "@heroui/react";
import { CheckCircleIcon, DotsThreeVerticalIcon, EyeIcon, FlagCheckeredIcon, KeyIcon, PackageIcon, SignOutIcon, XCircleIcon } from "@phosphor-icons/react";
import { AdminStatusBadge, type AdminStatus } from "@/components/admin/data-display/status-badge";
import { actionLabels, type Booking, type BookingStatus, canMarkNoShow, durationLabel, fmtShort, isOverdue, lateMinutes, paymentLabels, type PaymentStatus, toBadge } from "./booking-data";

export function BookingStatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  const badge = toBadge(status);
  return <AdminStatusBadge status={badge.status} label={badge.label} className={`${badge.className ?? ""} ${className ?? ""}`} />;
}

const paymentTone: Record<PaymentStatus, AdminStatus> = { unpaid: "unpaid", pending: "pending", paid: "paid", failed: "failed", refunded: "refunded", "partially-refunded": "partially-refunded" };
export function PaymentStatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  return <AdminStatusBadge status={paymentTone[status]} label={paymentLabels[status]} className={className} />;
}

export function BookingOperationalStatus({ booking }: { booking: Booking }) {
  const overdue = isOverdue(booking);
  return <div className="min-w-32 space-y-1"><BookingStatusBadge status={booking.status} />
    {booking.status === "active" ? <p className={`text-[11px] font-semibold ${overdue ? "text-[var(--admin-danger)]" : "text-[var(--admin-muted)]"}`}>{overdue ? `Overdue ${durationLabel(lateMinutes(booking))}` : `Due ${fmtShort(booking.returnAt)}`}</p> : null}
    {booking.status === "returned" ? <p className="text-[11px] font-semibold text-[var(--admin-warning)]">Awaiting completion</p> : null}
  </div>;
}

export type BookingHandlers = {
  onView: (booking: Booking) => void;
  onAdvance: (booking: Booking, next: BookingStatus) => void;
  onCancel: (booking: Booking) => void;
  onNoShow: (booking: Booking) => void;
  onOperate: (booking: Booking) => void;
};

export function BookingActions({ booking, handlers, className }: { booking: Booking; handlers: BookingHandlers; className?: string }) {
  const simpleNext = booking.status === "pending" ? "confirmed" : booking.status === "confirmed" ? "ready_for_pickup" : null;
  const operationalNext = booking.status === "ready_for_pickup" ? "active" : booking.status === "active" ? "returned" : booking.status === "returned" ? "completed" : null;
  const OperationIcon = operationalNext === "active" ? KeyIcon : operationalNext === "returned" ? SignOutIcon : FlagCheckeredIcon;
  return (
    <Dropdown>
      <Button isIconOnly size="sm" variant="ghost" aria-label={`Actions for ${booking.reference}`} className={`size-11 min-w-11 md:size-9 md:min-w-9 ${className ?? ""}`}><DotsThreeVerticalIcon size={20} weight="bold" /></Button>
      <Dropdown.Popover className="adminOverlay"><Dropdown.Menu aria-label={`Actions for ${booking.reference}`}>
        <Dropdown.Item id="view" textValue="View details" onAction={() => handlers.onView(booking)}><EyeIcon size={16} /><Label>View Details</Label></Dropdown.Item>
        {simpleNext ? <Dropdown.Item id={simpleNext} textValue={actionLabels[simpleNext]} onAction={() => handlers.onAdvance(booking, simpleNext)}>{simpleNext === "confirmed" ? <CheckCircleIcon size={16} /> : <PackageIcon size={16} />}<Label>{actionLabels[simpleNext]}</Label></Dropdown.Item> : null}
        {operationalNext ? <Dropdown.Item id={operationalNext} textValue={actionLabels[operationalNext]} onAction={() => handlers.onOperate(booking)}><OperationIcon size={16} /><Label>{actionLabels[operationalNext]}</Label></Dropdown.Item> : null}
        {canMarkNoShow(booking) ? <Dropdown.Item id="no_show" textValue="Mark No Show" onAction={() => handlers.onNoShow(booking)}><XCircleIcon size={16} /><Label>Mark No Show</Label></Dropdown.Item> : null}
        {["pending", "confirmed", "ready_for_pickup"].includes(booking.status) ? <Dropdown.Item id="cancelled" textValue="Cancel Booking" variant="danger" onAction={() => handlers.onCancel(booking)}><XCircleIcon size={16} /><Label>Cancel Booking</Label></Dropdown.Item> : null}
      </Dropdown.Menu></Dropdown.Popover>
    </Dropdown>
  );
}
