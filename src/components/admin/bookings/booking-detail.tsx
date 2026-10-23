"use client";

import { Button, useOverlayState } from "@heroui/react";
import { ArrowRightIcon, CalendarCheckIcon, CheckIcon, ClockCountdownIcon, EnvelopeSimpleIcon, FlagCheckeredIcon, GasPumpIcon, GearIcon, HourglassIcon, KeyIcon, MapPinIcon, PackageIcon, PhoneIcon, PlusCircleIcon, SpeedometerIcon, TimerIcon, WalletIcon, XCircleIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { ActivityTimeline, MoneyDisplay, type ActivityItem, type ActivityState } from "@/components/admin/data-display/misc";
import { AdminErrorState } from "@/components/admin/feedback";
import { AdminPage, PageHeader } from "@/components/admin/layout";
import { AdminBreadcrumbs } from "@/components/admin/navigation";
import { VehiclePhoto } from "@/components/admin/vehicles/vehicle-photo";
import { cn } from "@/lib/cn";
import { type Booking, canCancel, fmtDateTime, fmtTime, getBooking, money, NOW, nextStatuses } from "./booking-data";
import { CancelBookingDialog, UpdateStatusModal } from "./booking-dialogs";
import { BookingStatusBadge, PaymentStatusBadge } from "./booking-parts";

const shift = (iso: string, minutes: number) => new Date(Date.parse(iso) + minutes * 60_000).toISOString();

function buildTimeline(booking: Booking): ActivityItem[] {
  const created: ActivityItem = { id: "created", state: "done", title: "Booking created", time: `${fmtDateTime(booking.createdAt)} ICT`, icon: <CalendarCheckIcon size={16} /> };
  if (booking.status === "expired") {
    return [created, { id: "expired", state: "failed", title: "Reservation hold expired", detail: "Payment wasn’t confirmed in time.", time: `${fmtDateTime(booking.expiredAt ?? booking.createdAt)} ICT`, icon: <HourglassIcon size={16} /> }];
  }
  const paid = ["paid", "refunded", "partially-refunded"].includes(booking.paymentStatus);
  const payment: ActivityItem = paid
    ? { id: "payment", state: "done", title: "Payment confirmed", time: `${fmtDateTime(shift(booking.createdAt, 5))} ICT`, icon: <WalletIcon size={16} /> }
    : booking.paymentStatus === "failed"
      ? { id: "payment", state: "failed", title: "Payment failed", detail: "The customer can retry before the hold ends.", time: "Awaiting retry", icon: <XCircleIcon size={16} /> }
      : { id: "payment", state: "current", title: "Payment pending", detail: booking.holdExpiresAt ? `Reservation held until ${fmtTime(booking.holdExpiresAt)} ICT` : undefined, time: "Waiting for the customer", icon: <WalletIcon size={16} /> };
  if (booking.status === "cancelled") {
    return [created, payment, { id: "cancelled", state: "failed", title: "Booking cancelled", detail: booking.cancelReason ?? undefined, time: `${fmtDateTime(booking.cancelledAt ?? booking.createdAt)} ICT`, icon: <XCircleIcon size={16} /> }];
  }
  const order = ["pending", "confirmed", "ready", "active", "completed"] as const;
  const index = order.indexOf(booking.status as (typeof order)[number]);
  const step = (i: number, id: string, title: string, icon: ReactNode, at: string | null, future: string): ActivityItem => {
    const state: ActivityState = i < index || (i === index && booking.status === "completed") ? "done" : i === index ? "current" : "future";
    return { id, state, title, icon, time: state === "future" ? future : `${fmtDateTime(at ?? booking.pickupAt)} ICT` };
  };
  return [
    created, payment,
    step(1, "confirmed", "Booking confirmed", <CheckIcon size={16} />, shift(booking.createdAt, 20), "Not confirmed yet"),
    step(2, "ready", "Ready for pickup", <PackageIcon size={16} />, shift(booking.pickupAt, -60), `Pickup ${fmtDateTime(booking.pickupAt)} ICT`),
    step(3, "active", "Active rental", <KeyIcon size={16} />, booking.pickupAt, "Starts at pickup"),
    { id: "return", state: booking.status === "completed" ? "done" : "future", title: "Expected return", icon: <ClockCountdownIcon size={16} />, time: `${fmtDateTime(booking.returnAt)} ICT` },
    step(4, "completed", "Completed", <FlagCheckeredIcon size={16} />, shift(booking.returnAt, 30), "After the vehicle is returned"),
  ];
}

function Card({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section aria-label={title} className={cn("adminSurface rounded-2xl p-4 sm:p-5", className)}>
      <header className="mb-4 flex items-center justify-between gap-3"><h2 className="text-sm font-extrabold">{title}</h2>{action}</header>
      {children}
    </section>
  );
}

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-surface-muted)] text-[var(--admin-muted)]">{icon}</span>
      <div className="min-w-0 flex-1"><dt className="text-[11px] font-medium text-[var(--admin-muted)]">{label}</dt><dd className="break-words text-sm font-semibold">{children}</dd></div>
    </div>
  );
}

function PriceLine({ label, value, muted = false, strong = false }: { label: string; value: ReactNode; muted?: boolean; strong?: boolean }) {
  return <div className={cn("flex items-center justify-between gap-3 text-sm", muted && "text-[var(--admin-muted)]", strong && "text-base font-extrabold")}><dt>{label}</dt><dd className="tabular-nums">{value}</dd></div>;
}

export function BookingDetail({ reference }: { reference: string }) {
  const router = useRouter();
  const statusModal = useOverlayState();
  const cancelDialog = useOverlayState();
  const [overrides, setOverrides] = useState<Partial<Booking>>({});
  const base = getBooking(reference);

  if (!base) return <AdminPage><PageHeader title="Booking Details" /><AdminErrorState title="Booking not found" description="This UI preview does not contain that booking." /></AdminPage>;
  const booking: Booking = { ...base, ...overrides };
  const prices = money(booking);
  const options = nextStatuses(booking.status);
  const advance = options.filter((value) => value !== "cancelled");
  const { vehicle, customer } = booking;
  const sameLocation = booking.pickupLocation === booking.returnLocation;
  const held = booking.status === "pending" && booking.holdExpiresAt && Date.parse(booking.holdExpiresAt) > NOW;

  const actions = (
    <>
      {advance.length || canCancel(booking.status) ? <Button variant="primary" className="min-h-11 flex-1 lg:flex-none" onPress={statusModal.open}>Update Status</Button> : null}
      {canCancel(booking.status) ? <Button variant="danger" className="min-h-11 flex-1 lg:flex-none" onPress={cancelDialog.open}><XCircleIcon />Cancel Booking</Button> : null}
    </>
  );

  return (
    <AdminPage className="gap-5">
      <AdminBreadcrumbs items={[{ label: "Bookings", href: "/admin/bookings" }, { label: booking.reference }]} />

      <header className="adminHero flex flex-col gap-4 rounded-3xl p-4 sm:p-5 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Booking {booking.reference}</h1>
            <BookingStatusBadge status={booking.status} />
            <PaymentStatusBadge status={booking.paymentStatus} />
          </div>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">Booked on {fmtDateTime(booking.createdAt)} ICT</p>
        </div>
        <div className="hidden gap-2 lg:flex">{actions}</div>
      </header>

      {held ? <div role="status" className="flex items-start gap-3 rounded-2xl bg-[var(--admin-warning-soft)] p-4 text-sm text-[var(--admin-warning)]"><TimerIcon size={20} className="mt-0.5 shrink-0" aria-hidden /><p><strong>Reservation held until {fmtTime(booking.holdExpiresAt as string)} ICT.</strong> It will expire automatically if payment isn’t confirmed.</p></div> : null}
      {booking.status === "expired" ? <div role="status" className="flex items-start gap-3 rounded-2xl bg-[var(--admin-surface-muted)] p-4 text-sm text-[var(--admin-muted)]"><HourglassIcon size={20} className="mt-0.5 shrink-0" aria-hidden /><p><strong className="text-[var(--admin-text)]">Expired.</strong> The reservation hold expired before payment confirmation, so this booking can’t be confirmed or started.</p></div> : null}
      {booking.status === "cancelled" ? <div role="status" className="flex items-start gap-3 rounded-2xl bg-[var(--admin-danger-soft)] p-4 text-sm text-[var(--admin-danger)]"><XCircleIcon size={20} className="mt-0.5 shrink-0" aria-hidden /><p><strong>Cancelled</strong>{booking.cancelReason ? ` — ${booking.cancelReason}` : ""}</p></div> : null}

      <div className="grid items-start gap-5 pb-24 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)] lg:pb-0">
        <div className="min-w-0 space-y-5">
          <Card title="Vehicle Information" action={<Button size="sm" variant="ghost" className="min-h-11 text-[var(--admin-info)] md:min-h-9" onPress={() => router.push(`/admin/vehicles/${vehicle.id}`)}>View<ArrowRightIcon size={14} /></Button>}>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr]">
              <VehiclePhoto vehicle={vehicle} priority className="aspect-[4/3] w-full rounded-2xl border border-[var(--admin-border)]" sizes="220px" />
              <div className="min-w-0">
                <h3 className="text-lg font-extrabold leading-tight">{vehicle.name}</h3>
                <p className="text-sm text-[var(--admin-muted)]">{vehicle.registrationNumber}</p>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div><dt className="text-[11px] text-[var(--admin-muted)]">Type</dt><dd className="font-semibold capitalize">{vehicle.vehicleType}</dd></div>
                  <div><dt className="text-[11px] text-[var(--admin-muted)]">Brand / model</dt><dd className="font-semibold">{vehicle.brand} {vehicle.model}</dd></div>
                  <div><dt className="flex items-center gap-1 text-[11px] text-[var(--admin-muted)]"><SpeedometerIcon size={12} aria-hidden />Engine</dt><dd className="font-semibold">{vehicle.engineCc ? `${vehicle.engineCc} cc` : "—"}</dd></div>
                  <div><dt className="flex items-center gap-1 text-[11px] text-[var(--admin-muted)]"><GasPumpIcon size={12} aria-hidden />Fuel</dt><dd className="font-semibold">{vehicle.fuelType ?? "—"}</dd></div>
                  <div><dt className="flex items-center gap-1 text-[11px] text-[var(--admin-muted)]"><GearIcon size={12} aria-hidden />Transmission</dt><dd className="font-semibold">{vehicle.transmission ?? "—"}</dd></div>
                </dl>
              </div>
            </div>
          </Card>

          <div className="grid items-stretch gap-5 md:grid-cols-2">
            <Card title="Customer Information" action={<Button size="sm" variant="ghost" className="min-h-11 text-[var(--admin-info)] md:min-h-9" onPress={() => router.push(`/admin/customers/${customer.id}`)}>View<ArrowRightIcon size={14} /></Button>}>
              <div className="mb-4 flex items-center gap-3"><CustomerAvatar name={customer.name} size="md" /><div className="min-w-0"><p className="truncate text-sm font-extrabold">{customer.name}</p><p className="text-xs text-[var(--admin-muted)]">{customer.reference}</p></div></div>
              <dl className="space-y-4">
                <Row icon={<PhoneIcon size={18} />} label="Phone">{customer.phone}</Row>
                <Row icon={<EnvelopeSimpleIcon size={18} />} label="Email">{customer.email}</Row>
                <Row icon={<MapPinIcon size={18} />} label="Location">{customer.city}, Cambodia</Row>
              </dl>
            </Card>
            <Card title="Rental Information">
              <dl className="space-y-4">
                <Row icon={<CalendarCheckIcon size={18} />} label="Pickup">{fmtDateTime(booking.pickupAt)}</Row>
                <Row icon={<CalendarCheckIcon size={18} />} label="Return">{fmtDateTime(booking.returnAt)}</Row>
                <Row icon={<TimerIcon size={18} />} label="Duration">{booking.days} {booking.days === 1 ? "day" : "days"}</Row>
                <Row icon={<MapPinIcon size={18} />} label={sameLocation ? "Pickup & return location" : "Pickup location"}>{booking.pickupLocation}</Row>
                {sameLocation ? null : <Row icon={<MapPinIcon size={18} />} label="Return location">{booking.returnLocation}</Row>}
              </dl>
              <p className="mt-4 text-[11px] text-[var(--admin-muted)]">All times in Asia/Phnom_Penh (ICT, UTC+7).</p>
            </Card>
          </div>

          {booking.addons.length ? (
            <Card title="Add-ons">
              <ul className="divide-y divide-[var(--admin-border)]">
                {booking.addons.map((addon) => (
                  <li key={addon.name} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-accent-soft)] text-[var(--admin-warning)]"><PlusCircleIcon size={18} aria-hidden /></span>
                    <div className="min-w-0 flex-1"><p className="text-sm font-bold">{addon.name}</p><p className="text-xs text-[var(--admin-muted)]">Qty {addon.quantity} × <MoneyDisplay amount={addon.unitMinor} className="text-xs font-medium" /> / day</p></div>
                    <MoneyDisplay amount={addon.quantity * addon.unitMinor * booking.days} className="text-sm" />
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>

        <div className="min-w-0 space-y-5">
          <Card title="Booking Timeline"><ActivityTimeline items={buildTimeline(booking)} /></Card>
          <Card title="Price Breakdown">
            <dl className="space-y-2.5">
              <PriceLine label="Daily rate (snapshot)" value={<MoneyDisplay amount={prices.daily} />} />
              <PriceLine label="Rental days" value={booking.days} />
              <PriceLine label="Rental subtotal" value={<MoneyDisplay amount={prices.rental} />} />
              {prices.addons ? <PriceLine label="Add-ons" value={<MoneyDisplay amount={prices.addons} />} /> : null}
              <PriceLine label="Platform fee (5%)" value={<MoneyDisplay amount={prices.fee} />} muted />
              <PriceLine label="VAT (10%)" value={<MoneyDisplay amount={prices.tax} />} muted />
              <div className="my-1 border-t border-dashed border-[var(--admin-border-strong)]" />
              <PriceLine label="Security deposit (refundable)" value={<MoneyDisplay amount={prices.deposit} />} />
              <div className="mt-1 flex items-end justify-between gap-3 rounded-xl bg-[var(--admin-accent-soft)] p-3">
                <dt className="text-sm font-extrabold">Total payable</dt>
                <dd className="text-right"><MoneyDisplay amount={prices.total} className="text-xl font-extrabold" /><span className="block text-[11px] text-[var(--admin-muted)]">USD</span></dd>
              </div>
            </dl>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--admin-border)] pt-3 text-sm"><span className="text-[var(--admin-muted)]">Payment status</span><PaymentStatusBadge status={booking.paymentStatus} /></div>
          </Card>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-[var(--admin-border)] bg-white/95 p-3 backdrop-blur-md lg:hidden">{actions}</div>

      <UpdateStatusModal booking={booking} initial={null} isOpen={statusModal.isOpen} onOpenChange={statusModal.setOpen} onCancelBooking={() => cancelDialog.open()} onConfirm={(_, status) => setOverrides((current) => ({ ...current, status }))} />
      <CancelBookingDialog booking={booking} isOpen={cancelDialog.isOpen} onOpenChange={cancelDialog.setOpen} onConfirm={(_, reason) => setOverrides((current) => ({ ...current, status: "cancelled", cancelledAt: new Date(NOW).toISOString(), cancelReason: reason.trim() || "Cancelled by an admin." }))} />
    </AdminPage>
  );
}
