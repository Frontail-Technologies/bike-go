"use client";

import { Button, Dropdown, Label } from "@heroui/react";
import { CheckCircleIcon, DotsThreeVerticalIcon, EyeIcon, FlagCheckeredIcon, KeyIcon, PackageIcon, XCircleIcon, type Icon } from "@phosphor-icons/react";
import { AdminStatusBadge, type AdminStatus } from "@/components/admin/data-display/status-badge";
import { actionLabels, type Booking, type BookingStatus, nextStatuses, paymentLabels, type PaymentStatus, toBadge } from "./booking-data";

export function BookingStatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  const badge = toBadge(status);
  return <AdminStatusBadge status={badge.status} label={badge.label} className={`${badge.className ?? ""} ${className ?? ""}`} />;
}

const paymentTone: Record<PaymentStatus, AdminStatus> = { unpaid: "unpaid", pending: "pending", paid: "paid", failed: "failed", refunded: "refunded", "partially-refunded": "partially-refunded" };
export function PaymentStatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  return <AdminStatusBadge status={paymentTone[status]} label={paymentLabels[status]} className={className} />;
}

const actionIcons: Partial<Record<BookingStatus, Icon>> = { confirmed: CheckCircleIcon, ready: PackageIcon, active: KeyIcon, completed: FlagCheckeredIcon, cancelled: XCircleIcon };

export type BookingHandlers = {
  onView: (booking: Booking) => void;
  onAdvance: (booking: Booking, next: BookingStatus) => void;
  onCancel: (booking: Booking) => void;
};

export function BookingActions({ booking, handlers, className }: { booking: Booking; handlers: BookingHandlers; className?: string }) {
  const options = nextStatuses(booking.status);
  return (
    <Dropdown>
      <Button isIconOnly size="sm" variant="ghost" aria-label={`Actions for ${booking.reference}`} className={`size-11 min-w-11 md:size-9 md:min-w-9 ${className ?? ""}`}><DotsThreeVerticalIcon size={20} weight="bold" /></Button>
      <Dropdown.Popover className="adminOverlay">
        <Dropdown.Menu aria-label={`Actions for ${booking.reference}`}>
          <Dropdown.Item id="view" textValue="View details" onAction={() => handlers.onView(booking)}><EyeIcon size={16} /><Label>View Details</Label></Dropdown.Item>
          {options.map((next) => {
            const ActionIcon = actionIcons[next] ?? CheckCircleIcon;
            const cancel = next === "cancelled";
            return (
              <Dropdown.Item key={next} id={next} textValue={actionLabels[next] ?? next} variant={cancel ? "danger" : "default"} onAction={() => (cancel ? handlers.onCancel(booking) : handlers.onAdvance(booking, next))}>
                <ActionIcon size={16} /><Label>{actionLabels[next]}</Label>
              </Dropdown.Item>
            );
          })}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
