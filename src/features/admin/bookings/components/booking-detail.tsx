"use client";

import { Alert, Button, useOverlayState } from "@heroui/react";
import { ArrowRightIcon, CalendarCheckIcon, CheckIcon, ClockCountdownIcon, EnvelopeSimpleIcon, FlagCheckeredIcon, GasPumpIcon, HourglassIcon, KeyIcon, MapPinIcon, PackageIcon, PhoneIcon, PlusCircleIcon, ShieldCheckIcon, SpeedometerIcon, TimerIcon, WalletIcon, WarningIcon, WrenchIcon, XCircleIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/admin/bookings/booking-parts";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { ActivityTimeline, type ActivityItem, type ActivityState } from "@/components/admin/data-display/misc";
import { DetailCard as Card, DetailRow as Row } from "@/components/admin/data-display/detail";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { AdminErrorState, AdminLoadingState, ConfirmationDialog } from "@/components/admin/feedback";
import { AdminPage, PageHeader } from "@/components/admin/layout";
import { CurrencyAmount } from "@/components/admin/money";
import { AdminBreadcrumbs } from "@/components/admin/navigation";
import { VehiclePhoto } from "@/components/admin/vehicles/vehicle-photo";
import { toast } from "@/components/ui/toast";
import { useVehicleMutations } from "@/features/admin/vehicles/hooks/use-vehicles";
import { ApiError } from "@/lib/api/error";
import { cn } from "@/lib/cn";
import { actionErrorMessage, useBookingActions } from "../hooks/use-booking-actions";
import { useBookingQuery } from "../hooks/use-bookings";
import { bookingLabels, canMoveTo, conditionLabels, durationLabel, fmtDateTime, fmtTime, fuelLabels, vehiclePhoto } from "../lib/booking-model";
import type { Booking } from "../types/booking";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";
import { adminT } from "@/features/admin/i18n/translate";
import { CancelBookingDialog, NoShowDialog, UpdateStatusModal } from "./booking-dialogs";
import { CompleteBookingDialog, HandoverDrawer, ReturnInspectionDrawer } from "./rental-operation-drawers";

function buildTimeline(booking: Booking): ActivityItem[] {
  const meta: Record<Booking["timeline"][number]["kind"], { title: string; icon: ReactNode; state?: ActivityState }> = {
    created: { title: adminT("bookings.timeline.created"), icon: <CalendarCheckIcon size={16} /> },
    payment_confirmed: { title: adminT("bookings.timeline.payment_confirmed"), icon: <WalletIcon size={16} /> },
    confirmed: { title: adminT("bookings.timeline.confirmed"), icon: <CheckIcon size={16} /> },
    ready_for_pickup: { title: adminT("bookings.timeline.ready_for_pickup"), icon: <PackageIcon size={16} /> },
    handed_over: { title: adminT("bookings.timeline.handed_over"), icon: <KeyIcon size={16} /> },
    rental_active: { title: adminT("bookings.timeline.rental_active"), icon: <KeyIcon size={16} /> },
    returned: { title: adminT("bookings.timeline.returned"), icon: <ClockCountdownIcon size={16} /> },
    completed: { title: adminT("bookings.timeline.completed"), icon: <FlagCheckeredIcon size={16} /> },
    cancelled: { title: adminT("bookings.timeline.cancelled"), icon: <XCircleIcon size={16} />, state: "failed" },
    expired: { title: adminT("bookings.timeline.expired"), icon: <HourglassIcon size={16} />, state: "failed" },
    no_show: { title: adminT("bookings.timeline.no_show"), icon: <XCircleIcon size={16} />, state: "failed" },
  };
  return booking.timeline.map((event, index) => ({
    id: `${event.kind}-${event.at}-${index}`,
    state: meta[event.kind].state ?? "done",
    title: meta[event.kind].title,
    detail: [event.note, event.actor].filter(Boolean).join(" · ") || undefined,
    time: `${fmtDateTime(event.at)} ICT`,
    icon: meta[event.kind].icon,
  }));
}

function PriceLine({ label, value, muted = false }: { label: string; value: ReactNode; muted?: boolean }) { return <div className={cn("flex items-center justify-between gap-3 text-sm", muted && "text-[var(--admin-muted)]")}><dt>{label}</dt><dd className="tabular-nums">{value}</dd></div>; }

export function BookingDetail({ reference }: { reference: string }) {
  const t = useAdminTranslations();
  const query = useBookingQuery(reference);
  const booking = query.data;
  if (query.isError && !booking) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return <AdminPage><PageHeader title={t("pages.bookings.detail")} /><AdminErrorState title={notFound ? t("bookings.detail.notFound") : t("bookings.detail.loadError")} description={query.error instanceof ApiError ? query.error.message : t("common.retryLater")} onRetry={notFound ? undefined : () => void query.refetch()} /></AdminPage>;
  }
  if (!booking) return <AdminPage><PageHeader title={t("pages.bookings.detail")} /><AdminLoadingState label={t("bookings.loadingBooking")} /></AdminPage>;
  return <BookingWorkspace booking={booking} />;
}

function BookingWorkspace({ booking }: { booking: Booking }) {
  const t = useAdminTranslations();
  const router = useRouter();
  const [now] = useState(() => Date.now());
  const actions = useBookingActions();
  const vehicles = useVehicleMutations();
  const statusModal = useOverlayState(); const cancelDialog = useOverlayState(); const noShowDialog = useOverlayState();
  const handoverDrawer = useOverlayState(); const returnDrawer = useOverlayState(); const completeDialog = useOverlayState(); const maintenanceDialog = useOverlayState();

  const { vehicle, customer, pricing } = booking;
  const status = booking.bookingStatus;
  const sameLocation = booking.pickupLocation.id === booking.returnLocation.id;
  const held = status === "pending" && booking.holdExpiresAt && Date.parse(booking.holdExpiresAt) > now;
  const overdue = booking.isOverdue; const distance = booking.distanceKm; const late = booking.lateMinutes;
  const damage = booking.returnInspection?.damageFound ?? false;
  const canMaintain = status === "returned" && damage && vehicle.status !== "maintenance";
  const noShow = booking.canMarkNoShow;

  const primaryAction = canMoveTo(booking, "confirmed") ? { label: t("bookings.action.confirmed"), press: statusModal.open }
    : canMoveTo(booking, "ready_for_pickup") ? { label: t("bookings.action.ready_for_pickup"), press: statusModal.open }
    : canMoveTo(booking, "active") ? { label: t("bookings.action.active"), press: handoverDrawer.open }
    : canMoveTo(booking, "returned") ? { label: t("bookings.action.returned"), press: returnDrawer.open }
    : canMoveTo(booking, "completed") ? { label: t("bookings.action.completed"), press: completeDialog.open } : null;
  const cancellable = canMoveTo(booking, "cancelled");
  const hasActions = Boolean(primaryAction || cancellable || noShow || canMaintain);
  const bar = <>{primaryAction ? <Button variant="primary" className="min-h-12 flex-1 lg:min-h-11 lg:flex-none" onPress={primaryAction.press}>{primaryAction.label}</Button> : null}
    {canMaintain ? <Button variant="outline" className="min-h-12 flex-1 lg:min-h-11 lg:flex-none" onPress={maintenanceDialog.open}><WrenchIcon />{t("bookings.detail.moveToMaintenance")}</Button> : null}
    {noShow ? <Button variant="outline" className="min-h-12 flex-1 lg:min-h-11 lg:flex-none" onPress={noShowDialog.open}>{t("bookings.detail.noShow")}</Button> : null}
    {cancellable ? <Button variant="danger" className="min-h-12 flex-1 lg:min-h-11 lg:flex-none" onPress={cancelDialog.open}><XCircleIcon />{t("bookings.detail.cancel")}</Button> : null}</>;

  async function moveToMaintenance() {
    try {
      await vehicles.setStatus.mutateAsync({ id: vehicle.id, status: "maintenance" });
      toast.success(t("bookings.toast.maintenance", { name: vehicle.name }));
      maintenanceDialog.close();
    } catch (error) {
      toast.danger(actionErrorMessage(error));
    }
  }

  return <AdminPage className="gap-5">
    <AdminBreadcrumbs items={[{ label: t("pages.bookings.title"), href: "/admin/bookings" }, { label: booking.reference }]} />
    <header className="adminHero flex flex-col gap-4 rounded-3xl p-4 sm:p-5 lg:flex-row lg:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("bookings.detail.title", { reference: booking.reference })}</h1><BookingStatusBadge status={status} /><PaymentStatusBadge status={booking.paymentStatus} />{overdue ? <AdminStatusBadge status="needs-review" label={t("bookings.overdue")} /> : null}</div><p className="mt-1 text-sm text-[var(--admin-muted)]">{t("bookings.detail.bookedOn", { date: fmtDateTime(booking.createdAt) })}</p></div><div className="hidden flex-wrap gap-2 lg:flex">{bar}</div></header>

    {held ? <Alert status="warning"><Alert.Indicator /><Alert.Content><Alert.Title>{t("bookings.detail.heldUntil", { time: fmtTime(booking.holdExpiresAt as string) })}</Alert.Title><Alert.Description>{t("bookings.detail.heldDescription")}</Alert.Description></Alert.Content></Alert> : null}
    {overdue ? <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>{t("bookings.detail.overdueTitle", { duration: durationLabel(late) })}</Alert.Title><Alert.Description>{t("bookings.detail.overdueDescription", { date: fmtDateTime(booking.returnAt) })}</Alert.Description></Alert.Content></Alert> : null}
    {status === "returned" ? <Alert status="success"><Alert.Indicator /><Alert.Content><Alert.Title>{t("bookings.detail.returnedTitle")}</Alert.Title><Alert.Description>{t("bookings.detail.returnedDescription")}</Alert.Description></Alert.Content></Alert> : null}
    {["cancelled", "expired", "no_show"].includes(status) ? <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>{bookingLabels[status]}</Alert.Title><Alert.Description>{booking.cancellationReason ?? t("bookings.detail.viewOnly")}</Alert.Description></Alert.Content></Alert> : null}

    <div className={cn("grid items-start gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]", hasActions && "pb-28 lg:pb-0")}><div className="min-w-0 space-y-5">
      <Card title={t("bookings.detail.vehicleInfo")} action={<Button size="sm" variant="ghost" className="min-h-11 text-[var(--admin-accent-strong)] md:min-h-9" onPress={() => router.push(`/admin/vehicles/${vehicle.id}`)}>{t("bookings.detail.view")}<ArrowRightIcon size={14} /></Button>}><div className="grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr]"><VehiclePhoto vehicle={vehiclePhoto(vehicle)} priority className="aspect-[4/3] w-full rounded-2xl border border-[var(--admin-border)]" sizes="220px" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-extrabold">{vehicle.name}</h3><AdminStatusBadge status={vehicle.status} /></div><p className="text-sm text-[var(--admin-muted)]">{vehicle.registrationNumber}</p><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-[11px] text-[var(--admin-muted)]">{t("bookings.detail.type")}</dt><dd className="font-semibold">{t(`vehicles.types.${vehicle.vehicleType}`)}</dd></div><div><dt className="text-[11px] text-[var(--admin-muted)]">{t("bookings.detail.brandModel")}</dt><dd className="font-semibold">{vehicle.brand} {vehicle.model}</dd></div></dl></div></div></Card>

      <div className="grid items-stretch gap-5 md:grid-cols-2"><Card title={t("bookings.detail.customerInfo")} action={<Button size="sm" variant="ghost" className="min-h-11 text-[var(--admin-accent-strong)] md:min-h-9" onPress={() => router.push(`/admin/customers/${customer.id}`)}>{t("bookings.detail.view")}<ArrowRightIcon size={14} /></Button>}><div className="mb-4 flex items-center gap-3"><CustomerAvatar name={customer.name} size="md" /><div><p className="text-sm font-extrabold">{customer.name}</p></div></div><dl className="space-y-4"><Row icon={<PhoneIcon size={18} />} label={t("bookings.detail.phone")}>{customer.phone ?? "—"}</Row><Row icon={<EnvelopeSimpleIcon size={18} />} label={t("bookings.detail.email")}>{customer.email ?? "—"}</Row></dl></Card>
        <Card title={t("bookings.detail.rentalInfo")}><dl className="space-y-4"><Row icon={<CalendarCheckIcon size={18} />} label={t("bookings.detail.scheduledPickup")}>{fmtDateTime(booking.pickupAt)}</Row><Row icon={<ClockCountdownIcon size={18} />} label={t("bookings.detail.expectedReturn")}>{fmtDateTime(booking.returnAt)}</Row><Row icon={<TimerIcon size={18} />} label={t("bookings.detail.rentalDuration")}>{t(booking.rentalDays === 1 ? "bookings.detail.dayOne" : "bookings.detail.days", { count: booking.rentalDays })}</Row><Row icon={<MapPinIcon size={18} />} label={sameLocation ? t("bookings.detail.pickupReturn") : t("bookings.detail.pickupLocation")}>{booking.pickupLocation.name}</Row>{sameLocation ? null : <Row icon={<MapPinIcon size={18} />} label={t("bookings.detail.returnLocation")}>{booking.returnLocation.name}</Row>}</dl><p className="mt-4 text-[11px] text-[var(--admin-muted)]">{t("bookings.detail.timesNote")}</p></Card></div>

      {booking.pickupInspection ? <Card title={t("bookings.detail.pickupSummary")}><dl className="grid gap-4 sm:grid-cols-2"><Row icon={<CalendarCheckIcon size={18} />} label={t("bookings.detail.actualPickup")}>{fmtDateTime(booking.pickupInspection.occurredAt)} ICT</Row><Row icon={<SpeedometerIcon size={18} />} label={t("bookings.detail.pickupMileage")}>{t("bookings.detail.km", { value: booking.pickupInspection.odometerKm.toLocaleString() })}</Row><Row icon={<GasPumpIcon size={18} />} label={t("bookings.detail.fuelLevel")}>{fuelLabels[booking.pickupInspection.fuelLevel]}</Row><Row icon={<ShieldCheckIcon size={18} />} label={t("bookings.detail.condition")}>{conditionLabels[booking.pickupInspection.condition]}</Row></dl>
        <div className="mt-4 rounded-xl bg-[var(--admin-surface-muted)] p-3 text-sm"><p className="text-xs text-[var(--admin-muted)]">{t("bookings.detail.existingDamage")}</p><p className="mt-1 font-semibold">{booking.pickupInspection.damageNotes || t("bookings.detail.noneRecorded")}</p></div>
        <p className="mt-3 text-xs text-[var(--admin-muted)]">{t("bookings.detail.licence")} {t(booking.pickupInspection.licenceVerified ? "bookings.detail.verified" : "bookings.detail.notVerified")} · {t("bookings.detail.identity")} {t(booking.pickupInspection.identityVerified ? "bookings.detail.verified" : "bookings.detail.notVerified")} · {t("bookings.detail.deposit")} {t(booking.pickupInspection.depositVerified ? "bookings.detail.verified" : "bookings.detail.notVerified")}{booking.pickupInspection.recordedBy ? t("bookings.detail.recordedBy", { name: booking.pickupInspection.recordedBy }) : ""}</p>
        {booking.pickupInspection.staffNotes ? <p className="mt-2 text-sm"><span className="text-xs text-[var(--admin-muted)]">{t("bookings.detail.staffNotes")}</span>{booking.pickupInspection.staffNotes}</p> : null}</Card> : null}

      {booking.returnInspection ? <Card title={t("bookings.detail.returnSummary")}><dl className="grid gap-4 sm:grid-cols-2"><Row icon={<CalendarCheckIcon size={18} />} label={t("bookings.detail.returnTimestamp")}>{fmtDateTime(booking.returnInspection.occurredAt)} ICT</Row><Row icon={<SpeedometerIcon size={18} />} label={t("bookings.detail.mileage")}>{booking.pickupInspection?.odometerKm.toLocaleString() ?? "—"} → {t("bookings.detail.km", { value: booking.returnInspection.odometerKm.toLocaleString() })}</Row><Row icon={<TimerIcon size={18} />} label={t("bookings.detail.distance")}>{t("bookings.detail.km", { value: distance?.toLocaleString() ?? "—" })}</Row><Row icon={<WarningIcon size={18} />} label={t("bookings.detail.lateReturn")}>{late ? durationLabel(late) : t("bookings.detail.onTime")}</Row><Row icon={<GasPumpIcon size={18} />} label={t("bookings.detail.fuelLevel")}>{fuelLabels[booking.returnInspection.fuelLevel]}</Row><Row icon={<ShieldCheckIcon size={18} />} label={t("bookings.detail.condition")}>{conditionLabels[booking.returnInspection.condition]}</Row></dl>
        <div className={cn("mt-4 rounded-xl p-3 text-sm", damage ? "bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]" : "bg-[var(--admin-success-soft)] text-[var(--admin-success)]")}><p className="font-bold">{damage ? t("bookings.detail.newDamage") : t("bookings.detail.noNewDamage")}</p>{booking.returnInspection.damageNotes ? <p className="mt-1">{booking.returnInspection.damageNotes}</p> : null}</div>
        {booking.returnInspection.staffNotes ? <p className="mt-3 text-sm"><span className="text-xs text-[var(--admin-muted)]">{t("bookings.detail.staffNotes")}</span>{booking.returnInspection.staffNotes}</p> : null}</Card> : null}

      {booking.addons.length ? <Card title={t("bookings.detail.addons")}><ul className="divide-y divide-[var(--admin-border)]">{booking.addons.map((addon) => <li key={`${addon.code}-${addon.name}`} className="flex items-center gap-3 py-2.5"><span className="flex size-9 items-center justify-center rounded-xl bg-[var(--admin-accent-soft)]"><PlusCircleIcon size={18} /></span><div className="flex-1"><p className="text-sm font-bold">{addon.name}</p><p className="text-xs text-[var(--admin-muted)]">{t("bookings.detail.addonLine", { quantity: addon.quantity })}<CurrencyAmount amount={addon.unitPriceMinor} currency={booking.currency} />{t("bookings.detail.perDay")}</p></div><CurrencyAmount amount={addon.totalMinor} currency={booking.currency} /></li>)}</ul></Card> : null}
    </div>

    <div className="min-w-0 space-y-5"><Card title={t("bookings.detail.timelineTitle")}><ActivityTimeline items={buildTimeline(booking)} /></Card><Card title={t("bookings.detail.price")}><dl className="space-y-2.5"><PriceLine label={t("bookings.detail.dailyRate")} value={<CurrencyAmount amount={pricing.dailyRateMinor} currency={booking.currency} />} /><PriceLine label={t("bookings.detail.rentalDays")} value={booking.rentalDays} /><PriceLine label={t("bookings.detail.subtotal")} value={<CurrencyAmount amount={pricing.rentalSubtotalMinor} currency={booking.currency} />} />{pricing.addonsTotalMinor ? <PriceLine label={t("bookings.detail.addons")} value={<CurrencyAmount amount={pricing.addonsTotalMinor} currency={booking.currency} />} /> : null}<PriceLine label={t("bookings.detail.platformFee")} value={<CurrencyAmount amount={pricing.platformFeeMinor} currency={booking.currency} />} muted /><PriceLine label={t("bookings.detail.vat")} value={<CurrencyAmount amount={pricing.taxesMinor} currency={booking.currency} />} muted /><div className="border-t border-dashed border-[var(--admin-border-strong)]" /><PriceLine label={t("bookings.detail.securityDeposit")} value={<CurrencyAmount amount={pricing.securityDepositMinor} currency={booking.currency} />} /><div className="flex items-end justify-between rounded-xl bg-[var(--admin-accent-soft)] p-3"><dt className="text-sm font-extrabold">{t("bookings.detail.totalPayable")}</dt><dd><CurrencyAmount amount={pricing.totalPayableMinor} currency={booking.currency} className="text-xl font-extrabold" /></dd></div></dl></Card></div></div>

    {hasActions ? <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 overflow-x-auto border-t border-[var(--admin-border)] bg-white/95 p-3 backdrop-blur-md lg:hidden">{bar}</div> : null}
    <UpdateStatusModal booking={booking} initial={canMoveTo(booking, "confirmed") ? "confirmed" : "ready_for_pickup"} isOpen={statusModal.isOpen} onOpenChange={statusModal.setOpen} onConfirm={(target, next, note) => actions.advance(target, next, note)} />
    <CancelBookingDialog booking={booking} isOpen={cancelDialog.isOpen} onOpenChange={cancelDialog.setOpen} onConfirm={(target, reason) => actions.advance(target, "cancelled", reason)} />
    <NoShowDialog booking={booking} isOpen={noShowDialog.isOpen} onOpenChange={noShowDialog.setOpen} onConfirm={(target, reason) => actions.advance(target, "no_show", reason)} />
    <HandoverDrawer booking={booking} isOpen={handoverDrawer.isOpen} onOpenChange={handoverDrawer.setOpen} onConfirm={(input) => actions.startRental(booking, input)} />
    <ReturnInspectionDrawer booking={booking} isOpen={returnDrawer.isOpen} onOpenChange={returnDrawer.setOpen} onConfirm={(input) => actions.returnVehicle(booking, input)} />
    <CompleteBookingDialog booking={booking} isOpen={completeDialog.isOpen} onOpenChange={completeDialog.setOpen} onConfirm={() => actions.advance(booking, "completed")} />
    <ConfirmationDialog isOpen={maintenanceDialog.isOpen} onOpenChange={maintenanceDialog.setOpen} title={t("bookings.detail.maintenanceTitle")} description={t("bookings.detail.maintenanceDescription")} confirmLabel={t("bookings.detail.moveToMaintenance")} isPending={vehicles.setStatus.isPending} onConfirm={() => void moveToMaintenance()} />
  </AdminPage>;
}
