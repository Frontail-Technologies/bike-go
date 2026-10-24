"use client";

import { Alert, Button, useOverlayState } from "@heroui/react";
import { ArrowRightIcon, CalendarCheckIcon, CheckIcon, ClockCountdownIcon, EnvelopeSimpleIcon, FlagCheckeredIcon, GasPumpIcon, HourglassIcon, KeyIcon, MapPinIcon, PackageIcon, PhoneIcon, PlusCircleIcon, ShieldCheckIcon, SpeedometerIcon, TimerIcon, WalletIcon, WarningIcon, WrenchIcon, XCircleIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { ActivityTimeline, MoneyDisplay, type ActivityItem, type ActivityState } from "@/components/admin/data-display/misc";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { AdminErrorState, ConfirmationDialog } from "@/components/admin/feedback";
import { AdminPage, PageHeader } from "@/components/admin/layout";
import { AdminBreadcrumbs } from "@/components/admin/navigation";
import { VehiclePhoto } from "@/components/admin/vehicles/vehicle-photo";
import { cn } from "@/lib/cn";
import { type Booking, type BookingStatus, canCancel, canMarkNoShow, distanceTravelled, durationLabel, fmtDateTime, fmtTime, getBooking, isOverdue, lateMinutes, money, NOW } from "./booking-data";
import { CancelBookingDialog, NoShowDialog, UpdateStatusModal } from "./booking-dialogs";
import { BookingStatusBadge, PaymentStatusBadge } from "./booking-parts";
import { CompleteBookingDialog, HandoverDrawer, ReturnInspectionDrawer } from "./rental-operation-drawers";

const shift = (iso: string, minutes: number) => new Date(Date.parse(iso) + minutes * 60_000).toISOString();
const happened = (status: BookingStatus, step: BookingStatus) => {
  const order: BookingStatus[] = ["pending", "confirmed", "ready_for_pickup", "active", "returned", "completed"];
  return order.indexOf(status) >= order.indexOf(step);
};

function buildTimeline(booking: Booking): ActivityItem[] {
  const created: ActivityItem = { id: "created", state: "done", title: "Booking Created", time: `${fmtDateTime(booking.createdAt)} ICT`, icon: <CalendarCheckIcon size={16} /> };
  const paid = ["paid", "refunded", "partially-refunded"].includes(booking.paymentStatus);
  const payment: ActivityItem = paid
    ? { id: "payment", state: "done", title: "Payment / Confirmation", time: `${fmtDateTime(booking.confirmedAt ?? shift(booking.createdAt, 5))} ICT`, icon: <WalletIcon size={16} /> }
    : { id: "payment", state: booking.paymentStatus === "failed" ? "failed" : "current", title: booking.paymentStatus === "failed" ? "Payment Failed" : "Payment Pending", time: "Awaiting confirmation", icon: <WalletIcon size={16} /> };
  if (booking.status === "expired") return [created, { id: "expired", state: "failed", title: "Expired", time: `${fmtDateTime(booking.expiredAt ?? booking.createdAt)} ICT`, icon: <HourglassIcon size={16} /> }];
  if (booking.status === "cancelled") return [created, payment, { id: "cancelled", state: "failed", title: "Cancelled", detail: booking.cancelReason ?? undefined, time: `${fmtDateTime(booking.cancelledAt ?? booking.createdAt)} ICT`, icon: <XCircleIcon size={16} /> }];
  if (booking.status === "no_show") return [created, payment, { id: "ready", state: "done", title: "Ready for Pickup", time: `${fmtDateTime(booking.readyAt ?? booking.pickupAt)} ICT`, icon: <PackageIcon size={16} /> }, { id: "no-show", state: "failed", title: "No Show", time: `${fmtDateTime(booking.noShowAt ?? booking.pickupAt)} ICT`, icon: <XCircleIcon size={16} /> }];
  const state = (step: BookingStatus): ActivityState => booking.status === step ? "current" : happened(booking.status, step) ? "done" : "future";
  const item = (id: string, step: BookingStatus, title: string, icon: ReactNode, time: string | null, future: string): ActivityItem => ({ id, state: state(step), title, icon, time: happened(booking.status, step) ? `${fmtDateTime(time ?? booking.pickupAt)} ICT` : future });
  return [created, payment,
    item("confirmed", "confirmed", "Booking Confirmed", <CheckIcon size={16} />, booking.confirmedAt, "Not confirmed yet"),
    item("ready", "ready_for_pickup", "Ready for Pickup", <PackageIcon size={16} />, booking.readyAt, `Pickup ${fmtDateTime(booking.pickupAt)} ICT`),
    item("handover", "active", "Vehicle Handed Over", <KeyIcon size={16} />, booking.handover?.actualPickupAt ?? null, "Awaiting handover"),
    item("active", "active", "Rental Active", <TimerIcon size={16} />, booking.handover?.actualPickupAt ?? null, "Starts after handover"),
    item("returned", "returned", "Vehicle Returned", <ClockCountdownIcon size={16} />, booking.returnInspection?.actualReturnAt ?? null, `Expected ${fmtDateTime(booking.returnAt)} ICT`),
    item("completed", "completed", "Booking Completed", <FlagCheckeredIcon size={16} />, booking.completedAt, "After return inspection"),
  ];
}

function Card({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section aria-label={title} className={cn("adminSurface rounded-2xl p-4 sm:p-5", className)}><header className="mb-4 flex items-center justify-between gap-3"><h2 className="text-sm font-extrabold">{title}</h2>{action}</header>{children}</section>;
}
function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return <div className="flex items-start gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-surface-muted)] text-[var(--admin-muted)]">{icon}</span><div className="min-w-0 flex-1"><dt className="text-[11px] font-medium text-[var(--admin-muted)]">{label}</dt><dd className="break-words text-sm font-semibold">{children}</dd></div></div>;
}
function PriceLine({ label, value, muted = false, strong = false }: { label: string; value: ReactNode; muted?: boolean; strong?: boolean }) { return <div className={cn("flex items-center justify-between gap-3 text-sm", muted && "text-[var(--admin-muted)]", strong && "text-base font-extrabold")}><dt>{label}</dt><dd className="tabular-nums">{value}</dd></div>; }

export function BookingDetail({ reference }: { reference: string }) {
  const router = useRouter();
  const statusModal = useOverlayState(); const cancelDialog = useOverlayState(); const noShowDialog = useOverlayState();
  const handoverDrawer = useOverlayState(); const returnDrawer = useOverlayState(); const completeDialog = useOverlayState(); const maintenanceDialog = useOverlayState();
  const [overrides, setOverrides] = useState<Partial<Booking>>({});
  const base = getBooking(reference);
  if (!base) return <AdminPage><PageHeader title="Booking Details" /><AdminErrorState title="Booking not found" description="This UI preview does not contain that booking." /></AdminPage>;
  const booking: Booking = { ...base, ...overrides }; const prices = money(booking); const { vehicle, customer } = booking;
  const sameLocation = booking.pickupLocation === booking.returnLocation;
  const held = booking.status === "pending" && booking.holdExpiresAt && Date.parse(booking.holdExpiresAt) > NOW;
  const overdue = isOverdue(booking); const distance = distanceTravelled(booking); const late = lateMinutes(booking);
  const patch = (change: Partial<Booking>) => setOverrides((current) => ({ ...current, ...change }));

  const primaryAction = booking.status === "pending" ? { label: "Confirm Booking", press: statusModal.open }
    : booking.status === "confirmed" ? { label: "Mark Ready for Pickup", press: statusModal.open }
    : booking.status === "ready_for_pickup" ? { label: "Start Rental", press: handoverDrawer.open }
    : booking.status === "active" ? { label: "Return Vehicle", press: returnDrawer.open }
    : booking.status === "returned" ? { label: "Complete Booking", press: completeDialog.open } : null;
  const actions = <>{primaryAction ? <Button variant="primary" className="min-h-12 flex-1 lg:min-h-11 lg:flex-none" onPress={primaryAction.press}>{primaryAction.label}</Button> : null}
    {booking.status === "returned" && booking.returnInspection?.newDamageFound && vehicle.status !== "maintenance" ? <Button variant="outline" className="min-h-12 flex-1 lg:min-h-11 lg:flex-none" onPress={maintenanceDialog.open}><WrenchIcon />Move to Maintenance</Button> : null}
    {canMarkNoShow(booking) ? <Button variant="outline" className="min-h-12 flex-1 lg:min-h-11 lg:flex-none" onPress={noShowDialog.open}>No Show</Button> : null}
    {canCancel(booking.status) ? <Button variant="danger" className="min-h-12 flex-1 lg:min-h-11 lg:flex-none" onPress={cancelDialog.open}><XCircleIcon />Cancel</Button> : null}</>;
  const hasActions = Boolean(primaryAction || canCancel(booking.status) || canMarkNoShow(booking) || (booking.status === "returned" && booking.returnInspection?.newDamageFound));

  return <AdminPage className="gap-5">
    <AdminBreadcrumbs items={[{ label: "Bookings", href: "/admin/bookings" }, { label: booking.reference }]} />
    <header className="adminHero flex flex-col gap-4 rounded-3xl p-4 sm:p-5 lg:flex-row lg:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Booking {booking.reference}</h1><BookingStatusBadge status={booking.status} /><PaymentStatusBadge status={booking.paymentStatus} />{overdue ? <AdminStatusBadge status="needs-review" label="Overdue" /> : null}</div><p className="mt-1 text-sm text-[var(--admin-muted)]">Booked on {fmtDateTime(booking.createdAt)} ICT</p></div><div className="hidden flex-wrap gap-2 lg:flex">{actions}</div></header>

    {held ? <Alert status="warning"><Alert.Indicator /><Alert.Content><Alert.Title>Reservation held until {fmtTime(booking.holdExpiresAt as string)} ICT</Alert.Title><Alert.Description>It expires if payment is not confirmed.</Alert.Description></Alert.Content></Alert> : null}
    {overdue ? <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>Rental overdue by {durationLabel(late)}</Alert.Title><Alert.Description>The expected return was {fmtDateTime(booking.returnAt)} ICT. The booking remains On Rent until staff completes a return inspection.</Alert.Description></Alert.Content></Alert> : null}
    {booking.status === "returned" ? <Alert status="success"><Alert.Indicator /><Alert.Content><Alert.Title>Vehicle Returned</Alert.Title><Alert.Description>Inspection is recorded. Complete the booking after operational review.</Alert.Description></Alert.Content></Alert> : null}
    {["cancelled", "expired", "no_show"].includes(booking.status) ? <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>{booking.status === "no_show" ? "No Show" : booking.status === "expired" ? "Expired" : "Cancelled"}</Alert.Title><Alert.Description>{booking.cancelReason ?? "This booking is view only and has no further operational actions."}</Alert.Description></Alert.Content></Alert> : null}

    <div className={cn("grid items-start gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]", hasActions && "pb-28 lg:pb-0")}><div className="min-w-0 space-y-5">
      <Card title="Vehicle Information" action={<Button size="sm" variant="ghost" className="min-h-11 text-[var(--admin-info)] md:min-h-9" onPress={() => router.push(`/admin/vehicles/${vehicle.id}`)}>View<ArrowRightIcon size={14} /></Button>}><div className="grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr]"><VehiclePhoto vehicle={vehicle} priority className="aspect-[4/3] w-full rounded-2xl border border-[var(--admin-border)]" sizes="220px" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-extrabold">{vehicle.name}</h3><AdminStatusBadge status={vehicle.status} /></div><p className="text-sm text-[var(--admin-muted)]">{vehicle.registrationNumber}</p><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-[11px] text-[var(--admin-muted)]">Type</dt><dd className="font-semibold capitalize">{vehicle.vehicleType}</dd></div><div><dt className="text-[11px] text-[var(--admin-muted)]">Brand / model</dt><dd className="font-semibold">{vehicle.brand} {vehicle.model}</dd></div><div><dt className="text-[11px] text-[var(--admin-muted)]">Engine</dt><dd className="font-semibold">{vehicle.engineCc ? `${vehicle.engineCc} cc` : "—"}</dd></div><div><dt className="text-[11px] text-[var(--admin-muted)]">Fuel</dt><dd className="font-semibold">{vehicle.fuelType ?? "—"}</dd></div></dl></div></div></Card>

      <div className="grid items-stretch gap-5 md:grid-cols-2"><Card title="Customer Information" action={<Button size="sm" variant="ghost" className="min-h-11 text-[var(--admin-info)] md:min-h-9" onPress={() => router.push(`/admin/customers/${customer.id}`)}>View<ArrowRightIcon size={14} /></Button>}><div className="mb-4 flex items-center gap-3"><CustomerAvatar name={customer.name} size="md" /><div><p className="text-sm font-extrabold">{customer.name}</p><p className="text-xs text-[var(--admin-muted)]">{customer.reference}</p></div></div><dl className="space-y-4"><Row icon={<PhoneIcon size={18} />} label="Phone">{customer.phone}</Row><Row icon={<EnvelopeSimpleIcon size={18} />} label="Email">{customer.email}</Row><Row icon={<MapPinIcon size={18} />} label="Location">{customer.city}, Cambodia</Row></dl></Card>
        <Card title="Rental Information"><dl className="space-y-4"><Row icon={<CalendarCheckIcon size={18} />} label="Scheduled pickup">{fmtDateTime(booking.pickupAt)}</Row><Row icon={<ClockCountdownIcon size={18} />} label="Expected return">{fmtDateTime(booking.returnAt)}</Row><Row icon={<TimerIcon size={18} />} label="Rental duration">{booking.days} {booking.days === 1 ? "day" : "days"}</Row><Row icon={<MapPinIcon size={18} />} label={sameLocation ? "Pickup & return" : "Pickup location"}>{booking.pickupLocation}</Row>{sameLocation ? null : <Row icon={<MapPinIcon size={18} />} label="Return location">{booking.returnLocation}</Row>}</dl><p className="mt-4 text-[11px] text-[var(--admin-muted)]">All times in Asia/Phnom_Penh (ICT, UTC+7).</p></Card></div>

      {booking.handover ? <Card title="Pickup Inspection Summary"><dl className="grid gap-4 sm:grid-cols-2"><Row icon={<CalendarCheckIcon size={18} />} label="Actual pickup">{fmtDateTime(booking.handover.actualPickupAt)} ICT</Row><Row icon={<SpeedometerIcon size={18} />} label="Pickup mileage">{booking.handover.odometerKm.toLocaleString()} km</Row><Row icon={<GasPumpIcon size={18} />} label="Fuel level">{booking.handover.fuelLevel.replaceAll("_", " ")}</Row><Row icon={<ShieldCheckIcon size={18} />} label="Condition"><span className="capitalize">{booking.handover.condition.replaceAll("_", " ")}</span></Row></dl><div className="mt-4 rounded-xl bg-[var(--admin-surface-muted)] p-3 text-sm"><p className="text-xs text-[var(--admin-muted)]">Existing damage</p><p className="mt-1 font-semibold">{booking.handover.existingDamageNotes || "None recorded"}</p></div></Card> : null}

      {booking.returnInspection ? <Card title="Return Inspection Summary"><dl className="grid gap-4 sm:grid-cols-2"><Row icon={<CalendarCheckIcon size={18} />} label="Return timestamp">{fmtDateTime(booking.returnInspection.actualReturnAt)} ICT</Row><Row icon={<SpeedometerIcon size={18} />} label="Pickup → return mileage">{booking.handover?.odometerKm.toLocaleString() ?? "—"} → {booking.returnInspection.odometerKm.toLocaleString()} km</Row><Row icon={<TimerIcon size={18} />} label="Distance travelled">{distance?.toLocaleString() ?? "—"} km</Row><Row icon={<WarningIcon size={18} />} label="Late return">{late ? durationLabel(late) : "On time"}</Row></dl><div className={cn("mt-4 rounded-xl p-3 text-sm", booking.returnInspection.newDamageFound ? "bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]" : "bg-[var(--admin-success-soft)] text-[var(--admin-success)]")}><p className="font-bold">{booking.returnInspection.newDamageFound ? "New damage found" : "No new damage found"}</p><p className="mt-1">{booking.returnInspection.damageNotes}</p></div></Card> : null}

      {booking.addons.length ? <Card title="Add-ons"><ul className="divide-y divide-[var(--admin-border)]">{booking.addons.map((addon) => <li key={addon.name} className="flex items-center gap-3 py-2.5"><span className="flex size-9 items-center justify-center rounded-xl bg-[var(--admin-accent-soft)]"><PlusCircleIcon size={18} /></span><div className="flex-1"><p className="text-sm font-bold">{addon.name}</p><p className="text-xs text-[var(--admin-muted)]">Qty {addon.quantity} × <MoneyDisplay amount={addon.unitMinor} /> / day</p></div><MoneyDisplay amount={addon.quantity * addon.unitMinor * booking.days} /></li>)}</ul></Card> : null}
    </div>

    <div className="min-w-0 space-y-5"><Card title="Booking Timeline"><ActivityTimeline items={buildTimeline(booking)} /></Card><Card title="Price Breakdown"><dl className="space-y-2.5"><PriceLine label="Daily rate (snapshot)" value={<MoneyDisplay amount={prices.daily} />} /><PriceLine label="Rental days" value={booking.days} /><PriceLine label="Rental subtotal" value={<MoneyDisplay amount={prices.rental} />} />{prices.addons ? <PriceLine label="Add-ons" value={<MoneyDisplay amount={prices.addons} />} /> : null}<PriceLine label="Platform fee (5%)" value={<MoneyDisplay amount={prices.fee} />} muted /><PriceLine label="VAT (10%)" value={<MoneyDisplay amount={prices.tax} />} muted /><div className="border-t border-dashed border-[var(--admin-border-strong)]" /><PriceLine label="Security deposit" value={<MoneyDisplay amount={prices.deposit} />} /><div className="flex items-end justify-between rounded-xl bg-[var(--admin-accent-soft)] p-3"><dt className="text-sm font-extrabold">Total payable</dt><dd><MoneyDisplay amount={prices.total} className="text-xl font-extrabold" /></dd></div></dl></Card></div></div>

    {hasActions ? <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 overflow-x-auto border-t border-[var(--admin-border)] bg-white/95 p-3 backdrop-blur-md lg:hidden">{actions}</div> : null}
    <UpdateStatusModal booking={booking} initial={booking.status === "pending" ? "confirmed" : "ready_for_pickup"} isOpen={statusModal.isOpen} onOpenChange={statusModal.setOpen} onCancelBooking={() => cancelDialog.open()} onConfirm={(_, status) => patch({ status, confirmedAt: status === "confirmed" ? new Date(NOW).toISOString() : booking.confirmedAt, readyAt: status === "ready_for_pickup" ? new Date(NOW).toISOString() : booking.readyAt })} />
    <CancelBookingDialog booking={booking} isOpen={cancelDialog.isOpen} onOpenChange={cancelDialog.setOpen} onConfirm={(_, reason) => patch({ status: "cancelled", cancelledAt: new Date(NOW).toISOString(), cancelReason: reason.trim() || "Cancelled by an admin.", vehicle: vehicle.status === "maintenance" || vehicle.status === "inactive" ? vehicle : { ...vehicle, status: "available" } })} />
    <NoShowDialog booking={booking} isOpen={noShowDialog.isOpen} onOpenChange={noShowDialog.setOpen} onConfirm={() => patch({ status: "no_show", noShowAt: new Date(NOW).toISOString(), vehicle: vehicle.status === "maintenance" || vehicle.status === "inactive" ? vehicle : { ...vehicle, status: "available" } })} />
    <HandoverDrawer booking={booking} isOpen={handoverDrawer.isOpen} onOpenChange={handoverDrawer.setOpen} onConfirm={(handover) => patch({ status: "active", handover, vehicle: { ...vehicle, status: "rented" } })} />
    <ReturnInspectionDrawer booking={booking} isOpen={returnDrawer.isOpen} onOpenChange={returnDrawer.setOpen} onConfirm={(returnInspection) => patch({ status: "returned", returnInspection })} />
    <CompleteBookingDialog booking={booking} isOpen={completeDialog.isOpen} onOpenChange={completeDialog.setOpen} onConfirm={() => patch({ status: "completed", completedAt: new Date(NOW).toISOString(), vehicle: vehicle.status === "maintenance" || vehicle.status === "inactive" ? vehicle : { ...vehicle, status: "available" } })} />
    <ConfirmationDialog isOpen={maintenanceDialog.isOpen} onOpenChange={maintenanceDialog.setOpen} title="Move vehicle to maintenance?" description="The return inspection found new damage. This local action marks the vehicle as Maintenance; it does not complete the booking." confirmLabel="Move to Maintenance" onConfirm={() => patch({ vehicle: { ...vehicle, status: "maintenance" } })} />
  </AdminPage>;
}
