"use client";

import { Alert, Button, useOverlayState } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRightIcon, CalendarCheckIcon, CheckIcon, ClockCountdownIcon, EnvelopeSimpleIcon, FlagCheckeredIcon, GasPumpIcon, HourglassIcon, KeyIcon, MapPinIcon, PackageIcon, PhoneIcon, PlusCircleIcon, ShieldCheckIcon, SpeedometerIcon, TimerIcon, WalletIcon, WarningIcon, WrenchIcon, XCircleIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/admin/bookings/booking-parts";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { ActivityTimeline, type ActivityItem, type ActivityState } from "@/components/admin/data-display/misc";
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
import { adminBookingQueryKeys } from "../query-keys";
import { useNow } from "../hooks/use-now";
import { bookingLabels, canMarkNoShow, canMoveTo, conditionLabels, distanceTravelled, durationLabel, fmtDateTime, fmtTime, fuelLabels, isOverdue, lateMinutes, vehiclePhoto } from "../lib/booking-model";
import type { Booking, BookingStatus } from "../types/booking";
import { CancelBookingDialog, NoShowDialog, UpdateStatusModal } from "./booking-dialogs";
import { CompleteBookingDialog, HandoverDrawer, ReturnInspectionDrawer } from "./rental-operation-drawers";

const path: BookingStatus[] = ["confirmed", "ready_for_pickup", "active", "returned", "completed"];
const stepMeta: Record<string, { title: string; icon: ReactNode; waiting: (booking: Booking) => string }> = {
  confirmed: { title: "Booking Confirmed", icon: <CheckIcon size={16} />, waiting: () => "Not confirmed yet" },
  ready_for_pickup: { title: "Ready for Pickup", icon: <PackageIcon size={16} />, waiting: (booking) => `Pickup ${fmtDateTime(booking.pickupAt)} ICT` },
  active: { title: "Vehicle Handed Over", icon: <KeyIcon size={16} />, waiting: () => "Awaiting handover" },
  returned: { title: "Vehicle Returned", icon: <ClockCountdownIcon size={16} />, waiting: (booking) => `Expected ${fmtDateTime(booking.returnAt)} ICT` },
  completed: { title: "Booking Completed", icon: <FlagCheckeredIcon size={16} />, waiting: () => "After return inspection" },
};

function buildTimeline(booking: Booking): ActivityItem[] {
  const at = (iso: string) => `${fmtDateTime(iso)} ICT`;
  const eventFor = (status: string) => booking.events.find((event) => event.toStatus === status);
  const created: ActivityItem = { id: "created", state: "done", title: "Booking Created", time: at(booking.createdAt), icon: <CalendarCheckIcon size={16} /> };
  const paid = ["paid", "refunded", "partially_refunded"].includes(booking.paymentStatus);
  const payment: ActivityItem = paid
    ? { id: "payment", state: "done", title: "Payment Received", time: "Recorded", icon: <WalletIcon size={16} /> }
    : { id: "payment", state: booking.paymentStatus === "failed" ? "failed" : "current", title: booking.paymentStatus === "failed" ? "Payment Failed" : "Payment Pending", time: "Awaiting confirmation", icon: <WalletIcon size={16} /> };

  const status = booking.bookingStatus;
  const failedStep = (id: string, title: string, time: string, icon: ReactNode, detail?: string | null): ActivityItem => ({ id, state: "failed", title, time, icon, detail: detail ?? undefined });
  if (status === "expired") return [created, failedStep("expired", "Expired", booking.holdExpiresAt ? at(booking.holdExpiresAt) : "Hold lapsed", <HourglassIcon size={16} />)];

  const reached = path.indexOf(status);
  const steps = path.filter((step) => path.indexOf(step) <= reached || eventFor(step)).map((step): ActivityItem => {
    const event = eventFor(step);
    const meta = stepMeta[step]!;
    const time = step === "active" && booking.pickupInspection ? at(booking.pickupInspection.occurredAt) : step === "returned" && booking.returnInspection ? at(booking.returnInspection.occurredAt) : event ? at(event.at) : step === "confirmed" ? at(booking.createdAt) : "Recorded";
    return { id: step, state: step === status ? "current" : "done", title: meta.title, icon: meta.icon, time, detail: event?.actor ? `by ${event.actor}${event.note ? ` — ${event.note}` : ""}` : event?.note ?? undefined };
  });

  if (status === "cancelled") return [created, payment, ...steps, failedStep("cancelled", "Cancelled", booking.cancelledAt ? at(booking.cancelledAt) : "Cancelled", <XCircleIcon size={16} />, booking.cancellationReason)];
  if (status === "no_show") {
    const event = eventFor("no_show");
    return [created, payment, ...steps, failedStep("no-show", "No Show", event ? at(event.at) : at(booking.pickupAt), <XCircleIcon size={16} />, event?.note)];
  }
  const future = path.filter((step) => !steps.some((item) => item.id === step)).map((step): ActivityItem => ({ id: step, state: "future" as ActivityState, title: stepMeta[step]!.title, icon: stepMeta[step]!.icon, time: stepMeta[step]!.waiting(booking) }));
  return [created, payment, ...steps, ...future];
}

function Card({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section aria-label={title} className={cn("adminSurface rounded-2xl p-4 sm:p-5", className)}><header className="mb-4 flex items-center justify-between gap-3"><h2 className="text-sm font-extrabold">{title}</h2>{action}</header>{children}</section>;
}
function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return <div className="flex items-start gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-surface-muted)] text-[var(--admin-muted)]">{icon}</span><div className="min-w-0 flex-1"><dt className="text-[11px] font-medium text-[var(--admin-muted)]">{label}</dt><dd className="break-words text-sm font-semibold">{children}</dd></div></div>;
}
function PriceLine({ label, value, muted = false }: { label: string; value: ReactNode; muted?: boolean }) { return <div className={cn("flex items-center justify-between gap-3 text-sm", muted && "text-[var(--admin-muted)]")}><dt>{label}</dt><dd className="tabular-nums">{value}</dd></div>; }

export function BookingDetail({ reference }: { reference: string }) {
  const query = useBookingQuery(reference);
  const booking = query.data;
  if (query.isError && !booking) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return <AdminPage><PageHeader title="Booking Details" /><AdminErrorState title={notFound ? "Booking not found" : "Couldn’t load the booking"} description={query.error instanceof ApiError ? query.error.message : "Try again in a moment."} onRetry={notFound ? undefined : () => void query.refetch()} /></AdminPage>;
  }
  if (!booking) return <AdminPage><PageHeader title="Booking Details" /><AdminLoadingState label="Loading booking…" /></AdminPage>;
  return <BookingWorkspace booking={booking} />;
}

function BookingWorkspace({ booking }: { booking: Booking }) {
  const router = useRouter();
  const now = useNow();
  const actions = useBookingActions();
  const vehicles = useVehicleMutations();
  const client = useQueryClient();
  const statusModal = useOverlayState(); const cancelDialog = useOverlayState(); const noShowDialog = useOverlayState();
  const handoverDrawer = useOverlayState(); const returnDrawer = useOverlayState(); const completeDialog = useOverlayState(); const maintenanceDialog = useOverlayState();

  const { vehicle, customer, pricing } = booking;
  const status = booking.bookingStatus;
  const sameLocation = booking.pickupLocation.id === booking.returnLocation.id;
  const held = status === "pending" && booking.holdExpiresAt && Date.parse(booking.holdExpiresAt) > now;
  const overdue = isOverdue(booking, now); const distance = distanceTravelled(booking); const late = lateMinutes(booking, now);
  const damage = booking.returnInspection?.damageFound ?? false;
  const canMaintain = status === "returned" && damage && vehicle.status !== "maintenance";
  const noShow = canMarkNoShow(booking, now);

  const primaryAction = canMoveTo(booking, "confirmed") ? { label: "Confirm Booking", press: statusModal.open }
    : canMoveTo(booking, "ready_for_pickup") ? { label: "Mark Ready for Pickup", press: statusModal.open }
    : canMoveTo(booking, "active") ? { label: "Start Rental", press: handoverDrawer.open }
    : canMoveTo(booking, "returned") ? { label: "Return Vehicle", press: returnDrawer.open }
    : canMoveTo(booking, "completed") ? { label: "Complete Booking", press: completeDialog.open } : null;
  const cancellable = canMoveTo(booking, "cancelled");
  const hasActions = Boolean(primaryAction || cancellable || noShow || canMaintain);
  const bar = <>{primaryAction ? <Button variant="primary" className="min-h-12 flex-1 lg:min-h-11 lg:flex-none" onPress={primaryAction.press}>{primaryAction.label}</Button> : null}
    {canMaintain ? <Button variant="outline" className="min-h-12 flex-1 lg:min-h-11 lg:flex-none" onPress={maintenanceDialog.open}><WrenchIcon />Move to Maintenance</Button> : null}
    {noShow ? <Button variant="outline" className="min-h-12 flex-1 lg:min-h-11 lg:flex-none" onPress={noShowDialog.open}>No Show</Button> : null}
    {cancellable ? <Button variant="danger" className="min-h-12 flex-1 lg:min-h-11 lg:flex-none" onPress={cancelDialog.open}><XCircleIcon />Cancel</Button> : null}</>;

  async function moveToMaintenance() {
    try {
      await vehicles.setStatus.mutateAsync({ id: vehicle.id, status: "maintenance" });
      toast.success(`${vehicle.name} moved to maintenance`);
      void client.invalidateQueries({ queryKey: adminBookingQueryKeys.root() });
    } catch (error) {
      toast.danger(actionErrorMessage(error));
    }
  }

  return <AdminPage className="gap-5">
    <AdminBreadcrumbs items={[{ label: "Bookings", href: "/admin/bookings" }, { label: booking.reference }]} />
    <header className="adminHero flex flex-col gap-4 rounded-3xl p-4 sm:p-5 lg:flex-row lg:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Booking {booking.reference}</h1><BookingStatusBadge status={status} /><PaymentStatusBadge status={booking.paymentStatus} />{overdue ? <AdminStatusBadge status="needs-review" label="Overdue" /> : null}</div><p className="mt-1 text-sm text-[var(--admin-muted)]">Booked on {fmtDateTime(booking.createdAt)} ICT</p></div><div className="hidden flex-wrap gap-2 lg:flex">{bar}</div></header>

    {held ? <Alert status="warning"><Alert.Indicator /><Alert.Content><Alert.Title>Reservation held until {fmtTime(booking.holdExpiresAt as string)} ICT</Alert.Title><Alert.Description>It expires if payment is not confirmed.</Alert.Description></Alert.Content></Alert> : null}
    {overdue ? <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>Rental overdue by {durationLabel(late)}</Alert.Title><Alert.Description>The expected return was {fmtDateTime(booking.returnAt)} ICT. The booking remains On Rent until staff completes a return inspection.</Alert.Description></Alert.Content></Alert> : null}
    {status === "returned" ? <Alert status="success"><Alert.Indicator /><Alert.Content><Alert.Title>Vehicle Returned</Alert.Title><Alert.Description>Inspection is recorded. Complete the booking after operational review.</Alert.Description></Alert.Content></Alert> : null}
    {["cancelled", "expired", "no_show"].includes(status) ? <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>{bookingLabels[status]}</Alert.Title><Alert.Description>{booking.cancellationReason ?? "This booking is view only and has no further operational actions."}</Alert.Description></Alert.Content></Alert> : null}

    <div className={cn("grid items-start gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]", hasActions && "pb-28 lg:pb-0")}><div className="min-w-0 space-y-5">
      <Card title="Vehicle Information" action={<Button size="sm" variant="ghost" className="min-h-11 text-[var(--admin-info)] md:min-h-9" onPress={() => router.push(`/admin/vehicles/${vehicle.id}`)}>View<ArrowRightIcon size={14} /></Button>}><div className="grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr]"><VehiclePhoto vehicle={vehiclePhoto(vehicle)} priority className="aspect-[4/3] w-full rounded-2xl border border-[var(--admin-border)]" sizes="220px" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-extrabold">{vehicle.name}</h3><AdminStatusBadge status={vehicle.status} /></div><p className="text-sm text-[var(--admin-muted)]">{vehicle.registrationNumber}</p><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-[11px] text-[var(--admin-muted)]">Type</dt><dd className="font-semibold capitalize">{vehicle.vehicleType}</dd></div><div><dt className="text-[11px] text-[var(--admin-muted)]">Brand / model</dt><dd className="font-semibold">{vehicle.brand} {vehicle.model}</dd></div></dl></div></div></Card>

      <div className="grid items-stretch gap-5 md:grid-cols-2"><Card title="Customer Information"><div className="mb-4 flex items-center gap-3"><CustomerAvatar name={customer.name} size="md" /><div><p className="text-sm font-extrabold">{customer.name}</p></div></div><dl className="space-y-4"><Row icon={<PhoneIcon size={18} />} label="Phone">{customer.phone ?? "—"}</Row><Row icon={<EnvelopeSimpleIcon size={18} />} label="Email">{customer.email ?? "—"}</Row></dl></Card>
        <Card title="Rental Information"><dl className="space-y-4"><Row icon={<CalendarCheckIcon size={18} />} label="Scheduled pickup">{fmtDateTime(booking.pickupAt)}</Row><Row icon={<ClockCountdownIcon size={18} />} label="Expected return">{fmtDateTime(booking.returnAt)}</Row><Row icon={<TimerIcon size={18} />} label="Rental duration">{booking.rentalDays} {booking.rentalDays === 1 ? "day" : "days"}</Row><Row icon={<MapPinIcon size={18} />} label={sameLocation ? "Pickup & return" : "Pickup location"}>{booking.pickupLocation.name}</Row>{sameLocation ? null : <Row icon={<MapPinIcon size={18} />} label="Return location">{booking.returnLocation.name}</Row>}</dl><p className="mt-4 text-[11px] text-[var(--admin-muted)]">All times in Asia/Phnom_Penh (ICT, UTC+7).</p></Card></div>

      {booking.pickupInspection ? <Card title="Pickup Inspection Summary"><dl className="grid gap-4 sm:grid-cols-2"><Row icon={<CalendarCheckIcon size={18} />} label="Actual pickup">{fmtDateTime(booking.pickupInspection.occurredAt)} ICT</Row><Row icon={<SpeedometerIcon size={18} />} label="Pickup mileage">{booking.pickupInspection.odometerKm.toLocaleString()} km</Row><Row icon={<GasPumpIcon size={18} />} label="Fuel level">{fuelLabels[booking.pickupInspection.fuelLevel]}</Row><Row icon={<ShieldCheckIcon size={18} />} label="Condition">{conditionLabels[booking.pickupInspection.condition]}</Row></dl>
        <div className="mt-4 rounded-xl bg-[var(--admin-surface-muted)] p-3 text-sm"><p className="text-xs text-[var(--admin-muted)]">Existing damage</p><p className="mt-1 font-semibold">{booking.pickupInspection.damageNotes || "None recorded"}</p></div>
        <p className="mt-3 text-xs text-[var(--admin-muted)]">Licence {booking.pickupInspection.licenceVerified ? "verified" : "not verified"} · Identity {booking.pickupInspection.identityVerified ? "verified" : "not verified"} · Deposit {booking.pickupInspection.depositVerified ? "verified" : "not verified"}{booking.pickupInspection.recordedBy ? ` · Recorded by ${booking.pickupInspection.recordedBy}` : ""}</p>
        {booking.pickupInspection.staffNotes ? <p className="mt-2 text-sm"><span className="text-xs text-[var(--admin-muted)]">Staff notes: </span>{booking.pickupInspection.staffNotes}</p> : null}</Card> : null}

      {booking.returnInspection ? <Card title="Return Inspection Summary"><dl className="grid gap-4 sm:grid-cols-2"><Row icon={<CalendarCheckIcon size={18} />} label="Return timestamp">{fmtDateTime(booking.returnInspection.occurredAt)} ICT</Row><Row icon={<SpeedometerIcon size={18} />} label="Pickup → return mileage">{booking.pickupInspection?.odometerKm.toLocaleString() ?? "—"} → {booking.returnInspection.odometerKm.toLocaleString()} km</Row><Row icon={<TimerIcon size={18} />} label="Distance travelled">{distance?.toLocaleString() ?? "—"} km</Row><Row icon={<WarningIcon size={18} />} label="Late return">{late ? durationLabel(late) : "On time"}</Row><Row icon={<GasPumpIcon size={18} />} label="Fuel level">{fuelLabels[booking.returnInspection.fuelLevel]}</Row><Row icon={<ShieldCheckIcon size={18} />} label="Condition">{conditionLabels[booking.returnInspection.condition]}</Row></dl>
        <div className={cn("mt-4 rounded-xl p-3 text-sm", damage ? "bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]" : "bg-[var(--admin-success-soft)] text-[var(--admin-success)]")}><p className="font-bold">{damage ? "New damage found" : "No new damage found"}</p>{booking.returnInspection.damageNotes ? <p className="mt-1">{booking.returnInspection.damageNotes}</p> : null}</div>
        {booking.returnInspection.staffNotes ? <p className="mt-3 text-sm"><span className="text-xs text-[var(--admin-muted)]">Staff notes: </span>{booking.returnInspection.staffNotes}</p> : null}</Card> : null}

      {booking.addons.length ? <Card title="Add-ons"><ul className="divide-y divide-[var(--admin-border)]">{booking.addons.map((addon) => <li key={`${addon.code}-${addon.name}`} className="flex items-center gap-3 py-2.5"><span className="flex size-9 items-center justify-center rounded-xl bg-[var(--admin-accent-soft)]"><PlusCircleIcon size={18} /></span><div className="flex-1"><p className="text-sm font-bold">{addon.name}</p><p className="text-xs text-[var(--admin-muted)]">Qty {addon.quantity} × <CurrencyAmount amount={addon.unitPriceMinor} currency={booking.currency} /> / day</p></div><CurrencyAmount amount={addon.totalMinor} currency={booking.currency} /></li>)}</ul></Card> : null}
    </div>

    <div className="min-w-0 space-y-5"><Card title="Booking Timeline"><ActivityTimeline items={buildTimeline(booking)} /></Card><Card title="Price Breakdown"><dl className="space-y-2.5"><PriceLine label="Daily rate (snapshot)" value={<CurrencyAmount amount={pricing.dailyRateMinor} currency={booking.currency} />} /><PriceLine label="Rental days" value={booking.rentalDays} /><PriceLine label="Rental subtotal" value={<CurrencyAmount amount={pricing.rentalSubtotalMinor} currency={booking.currency} />} />{pricing.addonsTotalMinor ? <PriceLine label="Add-ons" value={<CurrencyAmount amount={pricing.addonsTotalMinor} currency={booking.currency} />} /> : null}<PriceLine label="Platform fee" value={<CurrencyAmount amount={pricing.platformFeeMinor} currency={booking.currency} />} muted /><PriceLine label="VAT" value={<CurrencyAmount amount={pricing.taxesMinor} currency={booking.currency} />} muted /><div className="border-t border-dashed border-[var(--admin-border-strong)]" /><PriceLine label="Security deposit" value={<CurrencyAmount amount={pricing.securityDepositMinor} currency={booking.currency} />} /><div className="flex items-end justify-between rounded-xl bg-[var(--admin-accent-soft)] p-3"><dt className="text-sm font-extrabold">Total payable</dt><dd><CurrencyAmount amount={pricing.totalPayableMinor} currency={booking.currency} className="text-xl font-extrabold" /></dd></div></dl></Card></div></div>

    {hasActions ? <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 overflow-x-auto border-t border-[var(--admin-border)] bg-white/95 p-3 backdrop-blur-md lg:hidden">{bar}</div> : null}
    <UpdateStatusModal booking={booking} initial={canMoveTo(booking, "confirmed") ? "confirmed" : "ready_for_pickup"} isOpen={statusModal.isOpen} onOpenChange={statusModal.setOpen} onConfirm={(target, next, note) => actions.advance(target, next, note)} />
    <CancelBookingDialog booking={booking} isOpen={cancelDialog.isOpen} onOpenChange={cancelDialog.setOpen} onConfirm={(target, reason) => actions.advance(target, "cancelled", reason)} />
    <NoShowDialog booking={booking} isOpen={noShowDialog.isOpen} onOpenChange={noShowDialog.setOpen} onConfirm={(target, reason) => actions.advance(target, "no_show", reason)} />
    <HandoverDrawer booking={booking} isOpen={handoverDrawer.isOpen} onOpenChange={handoverDrawer.setOpen} onConfirm={(input) => actions.startRental(booking, input)} />
    <ReturnInspectionDrawer booking={booking} isOpen={returnDrawer.isOpen} onOpenChange={returnDrawer.setOpen} onConfirm={(input) => actions.returnVehicle(booking, input)} />
    <CompleteBookingDialog booking={booking} isOpen={completeDialog.isOpen} onOpenChange={completeDialog.setOpen} onConfirm={() => actions.advance(booking, "completed")} />
    <ConfirmationDialog isOpen={maintenanceDialog.isOpen} onOpenChange={maintenanceDialog.setOpen} title="Move vehicle to maintenance?" description="The return inspection found new damage. This marks the vehicle as Maintenance so it stays unavailable after completion; it does not complete the booking." confirmLabel="Move to Maintenance" onConfirm={() => void moveToMaintenance()} />
  </AdminPage>;
}
