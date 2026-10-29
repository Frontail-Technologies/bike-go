"use client";

import { Button, Dropdown, Label } from "@heroui/react";
import { CheckCircleIcon, DotsThreeVerticalIcon, EyeIcon, FlagCheckeredIcon, KeyIcon, PackageIcon, SignOutIcon, XCircleIcon } from "@phosphor-icons/react";
import { BookingStatusBadge } from "@/components/admin/bookings/booking-parts";
import { actionLabels, canMoveTo, durationLabel, fmtShort } from "../lib/booking-model";
import type { Booking, BookingStatus } from "../types/booking";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

export function BookingOperationalStatus({ booking }: { booking: Booking }) {
  const t = useAdminTranslations();
  return (
    <div className="min-w-32 space-y-1">
      <BookingStatusBadge status={booking.bookingStatus} />
      {booking.bookingStatus === "active" ? <p className={`text-[11px] font-semibold ${booking.isOverdue ? "text-[var(--admin-danger)]" : "text-[var(--admin-muted)]"}`}>{booking.isOverdue ? t("bookings.overdueBy", { duration: durationLabel(booking.lateMinutes) }) : t("bookings.due", { date: fmtShort(booking.returnAt) })}</p> : null}
      {booking.bookingStatus === "returned" ? <p className="text-[11px] font-semibold text-[var(--admin-warning)]">{t("bookings.awaitingCompletion")}</p> : null}
    </div>
  );
}

export type BookingHandlers = {
  onView: (booking: Booking) => void;
  onAdvance: (booking: Booking, next: BookingStatus) => void;
  onCancel: (booking: Booking) => void;
  onNoShow: (booking: Booking) => void;
  onOperate: (booking: Booking) => void;
};

export function BookingActions({ booking, handlers, className }: { booking: Booking; handlers: BookingHandlers; className?: string }) {
  const t = useAdminTranslations();
  const simpleNext = (["confirmed", "ready_for_pickup"] as const).find((status) => canMoveTo(booking, status));
  const operationalNext = (["active", "returned", "completed"] as const).find((status) => canMoveTo(booking, status));
  const OperationIcon = operationalNext === "active" ? KeyIcon : operationalNext === "returned" ? SignOutIcon : FlagCheckeredIcon;
  return (
    <Dropdown>
      <Button isIconOnly size="sm" variant="ghost" aria-label={t("bookings.actionsFor", { reference: booking.reference })} className={`size-11 min-w-11 md:size-9 md:min-w-9 ${className ?? ""}`}><DotsThreeVerticalIcon size={20} weight="bold" /></Button>
      <Dropdown.Popover className="adminOverlay"><Dropdown.Menu aria-label={t("bookings.actionsFor", { reference: booking.reference })}>
        <Dropdown.Item id="view" textValue={t("bookings.viewDetails")} onAction={() => handlers.onView(booking)}><EyeIcon size={16} /><Label>{t("bookings.viewDetails")}</Label></Dropdown.Item>
        {simpleNext ? <Dropdown.Item id={simpleNext} textValue={actionLabels[simpleNext]} onAction={() => handlers.onAdvance(booking, simpleNext)}>{simpleNext === "confirmed" ? <CheckCircleIcon size={16} /> : <PackageIcon size={16} />}<Label>{actionLabels[simpleNext]}</Label></Dropdown.Item> : null}
        {operationalNext ? <Dropdown.Item id={operationalNext} textValue={actionLabels[operationalNext]} onAction={() => handlers.onOperate(booking)}><OperationIcon size={16} /><Label>{actionLabels[operationalNext]}</Label></Dropdown.Item> : null}
        {booking.canMarkNoShow ? <Dropdown.Item id="no_show" textValue={actionLabels.no_show} onAction={() => handlers.onNoShow(booking)}><XCircleIcon size={16} /><Label>{actionLabels.no_show}</Label></Dropdown.Item> : null}
        {canMoveTo(booking, "cancelled") ? <Dropdown.Item id="cancelled" textValue={actionLabels.cancelled} variant="danger" onAction={() => handlers.onCancel(booking)}><XCircleIcon size={16} /><Label>{actionLabels.cancelled}</Label></Dropdown.Item> : null}
      </Dropdown.Menu></Dropdown.Popover>
    </Dropdown>
  );
}
