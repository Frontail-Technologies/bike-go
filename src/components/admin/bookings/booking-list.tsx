"use client";

import { Button, Drawer, useOverlayState } from "@heroui/react";
import { ArrowCounterClockwiseIcon, GridFourIcon, ListIcon, SlidersHorizontalIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";
import { AdminPagination, AdminSearch, AdminSelect, ViewToggle } from "@/components/admin/controls";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { MoneyDisplay } from "@/components/admin/data-display/misc";
import { AdminPage, ContentSection, PageHeader } from "@/components/admin/layout";
import { VehiclePhoto } from "@/components/admin/vehicles/vehicle-photo";
import { AdminBookingCard } from "./admin-booking-card";
import { type Booking, type BookingStatus, bookingLabels, bookingStatuses, bookings as seed, fmtDate, fmtShort, money, NOW, paymentLabels, paymentStatuses } from "./booking-data";
import { CancelBookingDialog, UpdateStatusModal } from "./booking-dialogs";
import { BookingActions, type BookingHandlers, BookingStatusBadge, PaymentStatusBadge } from "./booking-parts";

const PAGE_SIZE = 8;
const all = "all";
type ViewMode = "table" | "cards";

const dateOptions = [
  { value: all, label: "All dates" },
  { value: "today", label: "Pickup today" },
  { value: "week", label: "Pickup in 7 days" },
  { value: "past", label: "Already returned" },
];
const DAY = 86_400_000;

export function BookingList() {
  const router = useRouter();
  const filterDrawer = useOverlayState();
  const statusModal = useOverlayState();
  const cancelDialog = useOverlayState();
  const [items, setItems] = useState<Booking[]>(seed);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(all);
  const [payment, setPayment] = useState(all);
  const [type, setType] = useState(all);
  const [location, setLocation] = useState(all);
  const [dates, setDates] = useState(all);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<ViewMode>("table");
  const [target, setTarget] = useState<Booking | null>(null);
  const [initialStatus, setInitialStatus] = useState<BookingStatus | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("ridego-admin-booking-view");
    const next: ViewMode = saved === "table" || saved === "cards" ? saved : window.innerWidth < 768 ? "cards" : "table";
    startTransition(() => setView(next));
  }, []);
  function changeView(next: ViewMode) { setView(next); window.localStorage.setItem("ridego-admin-booking-view", next); }

  const locations = useMemo(() => [...new Set(items.flatMap((item) => [item.pickupLocation]))].sort(), [items]);
  const filtered = useMemo(() => items.filter((item) => {
    const term = search.trim().toLowerCase();
    const pickup = Date.parse(item.pickupAt);
    return (!term || `${item.reference} ${item.customer.name} ${item.customer.phone} ${item.vehicle.name} ${item.vehicle.registrationNumber}`.toLowerCase().includes(term))
      && (status === all || item.status === status) && (payment === all || item.paymentStatus === payment)
      && (type === all || item.vehicle.vehicleType === type) && (location === all || item.pickupLocation === location)
      && (dates === all || (dates === "today" && Math.abs(pickup - NOW) < DAY) || (dates === "week" && pickup >= NOW - DAY / 2 && pickup <= NOW + 7 * DAY) || (dates === "past" && Date.parse(item.returnAt) < NOW));
  }).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)), [items, search, status, payment, type, location, dates]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const activeFilters = [status, payment, type, location, dates].filter((value) => value !== all).length;
  const filtersActive = Boolean(search || activeFilters);
  const update = (setter: (value: string) => void) => (value: string) => { setter(value); setPage(1); };
  const reset = () => { setSearch(""); setStatus(all); setPayment(all); setType(all); setLocation(all); setDates(all); setPage(1); };

  const handlers: BookingHandlers = {
    onView: (booking) => router.push(`/admin/bookings/${booking.reference}`),
    onAdvance: (booking, next) => { setTarget(booking); setInitialStatus(next); statusModal.open(); },
    onCancel: (booking) => { setTarget(booking); cancelDialog.open(); },
  };
  const patch = (reference: string, change: Partial<Booking>) => setItems((current) => current.map((item) => item.reference === reference ? { ...item, ...change } : item));

  const columns: ColumnDef<Booking>[] = [
    { accessorKey: "reference", header: "Booking", cell: ({ row }) => <div className="min-w-14 whitespace-nowrap"><p className="font-bold">{row.original.reference}</p><p className="text-xs text-[var(--admin-muted)]">{fmtDate(row.original.createdAt).slice(0, 6)}</p></div> },
    { id: "customer", header: "Customer", accessorFn: (row) => row.customer.name, cell: ({ row }) => <div className="flex min-w-28 max-w-40 items-center gap-2"><CustomerAvatar name={row.original.customer.name} size="sm" className="size-7 text-[10px]" /><div className="min-w-0"><p className="truncate font-semibold leading-tight">{row.original.customer.name}</p><p className="whitespace-nowrap text-xs text-[var(--admin-muted)]">{row.original.customer.phone}</p></div></div> },
    { id: "vehicle", header: "Vehicle", accessorFn: (row) => row.vehicle.name, cell: ({ row }) => <div className="flex min-w-32 max-w-40 items-center gap-2.5"><VehiclePhoto vehicle={row.original.vehicle} className="h-8 w-11 shrink-0 rounded-lg border border-[var(--admin-border)]" sizes="56px" /><div className="min-w-0"><p className="truncate font-semibold leading-tight">{row.original.vehicle.name}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.vehicle.registrationNumber}</p></div></div> },
    { id: "period", header: "Rental period", accessorFn: (row) => row.pickupAt, cell: ({ row }) => <div className="min-w-24 whitespace-nowrap text-xs"><p className="font-medium">{fmtShort(row.original.pickupAt)}</p><p className="text-[var(--admin-muted)]">{fmtShort(row.original.returnAt)}</p></div> },
    { id: "location", header: "Location", accessorFn: (row) => row.pickupLocation, cell: ({ row }) => <div className="min-w-24 max-w-28 text-xs"><p className="font-medium">{row.original.pickupLocation}</p>{row.original.returnLocation !== row.original.pickupLocation ? <p className="text-[var(--admin-muted)]">Return: {row.original.returnLocation}</p> : null}</div> },
    { id: "amount", header: "Amount", accessorFn: (row) => money(row).total, cell: ({ row }) => <div><MoneyDisplay amount={money(row.original).total} /></div> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <BookingStatusBadge status={row.original.status} /> },
    { accessorKey: "paymentStatus", header: "Payment", cell: ({ row }) => <PaymentStatusBadge status={row.original.paymentStatus} /> },
  ];
  const data = rows.map((row) => ({ ...row, id: row.reference }));

  const filterControls = (className?: string) => (
    <>
      <AdminSelect className={className} label="All statuses" value={status} onChange={update(setStatus)} options={[{ value: all, label: "All statuses" }, ...bookingStatuses.map((value) => ({ value, label: bookingLabels[value] }))]} />
      <AdminSelect className={className} label="All payments" value={payment} onChange={update(setPayment)} options={[{ value: all, label: "All payments" }, ...paymentStatuses.map((value) => ({ value, label: paymentLabels[value] }))]} />
      <AdminSelect className={className} label="All vehicle types" value={type} onChange={update(setType)} options={[{ value: all, label: "All vehicle types" }, ...(["motorcycle", "scooter", "car", "other"] as const).map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))]} />
      <AdminSelect className={className} label="All locations" value={location} onChange={update(setLocation)} options={[{ value: all, label: "All locations" }, ...locations.map((value) => ({ value, label: value }))]} />
      <AdminSelect className={className} label="All dates" value={dates} onChange={update(setDates)} options={dateOptions} />
    </>
  );

  const empty = <p className="py-12 text-center text-sm text-[var(--admin-muted)]">No bookings match these filters.</p>;
  const pagination = <div className="border-t border-[var(--admin-border)]"><AdminPagination page={safePage} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} /></div>;

  return (
    <AdminPage>
      <PageHeader title="Bookings" description="Manage vehicle bookings, rental status, and customer activity." />
      <ContentSection className="overflow-visible">
        <div className="space-y-3 border-b border-[var(--admin-border)] p-4">
          <div className="flex items-center gap-2">
            <AdminSearch className="w-auto min-w-0 max-w-none flex-1 basis-0 sm:max-w-xl" value={search} onChange={update(setSearch)} placeholder="Search booking, customer, vehicle…" />
            <Button variant="outline" className="relative min-h-11 shrink-0 lg:hidden" onPress={filterDrawer.open} aria-label={`Filters${activeFilters ? `, ${activeFilters} active` : ""}`}>
              <SlidersHorizontalIcon size={18} /><span className="max-sm:sr-only">Filters</span>
              {activeFilters ? <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--admin-accent)] text-[11px] font-extrabold text-[#111820]">{activeFilters}</span> : null}
            </Button>
            <div className="ml-auto"><ViewToggle label="Booking view" value={view} onChange={changeView} options={[{ value: "table", label: "Table", icon: <ListIcon size={17} /> }, { value: "cards", label: "Cards", icon: <GridFourIcon size={17} /> }]} /></div>
          </div>
          <div className="hidden flex-wrap items-center gap-2 lg:flex">
            {filterControls()}
            {filtersActive ? <Button size="sm" variant="ghost" className="min-h-10" onPress={reset}><ArrowCounterClockwiseIcon size={15} />Reset filters</Button> : null}
            <p className="ml-auto text-xs font-semibold text-[var(--admin-muted)]" aria-live="polite">{filtered.length} booking{filtered.length === 1 ? "" : "s"}</p>
          </div>
        </div>

        {view === "table" ? (
          <AdminDataTable columns={columns as ColumnDef<Booking & { id: string }>[]} data={data} label="Bookings" emptyState="No bookings match these filters." pagination={{ page: safePage, pageSize: PAGE_SIZE, total: filtered.length, onPageChange: setPage }} onRowNavigate={handlers.onView} rowActions={(booking) => <BookingActions booking={booking} handlers={handlers} />} minWidth={960} />
        ) : (
          <>
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 2xl:grid-cols-3">
              {rows.map((booking) => <AdminBookingCard key={booking.reference} booking={booking} handlers={handlers} />)}
              {!rows.length ? <div className="col-span-full">{empty}</div> : null}
            </div>
            {pagination}
          </>
        )}
      </ContentSection>

      <Drawer.Backdrop isOpen={filterDrawer.isOpen} onOpenChange={filterDrawer.setOpen} className="adminOverlay">
        <Drawer.Content placement="bottom" className="mx-auto w-full max-w-lg rounded-t-3xl">
          <Drawer.Dialog aria-label="Filter bookings">
            <Drawer.CloseTrigger />
            <Drawer.Header><Drawer.Heading>Filter bookings</Drawer.Heading></Drawer.Header>
            <Drawer.Body className="grid gap-3">{filterControls("w-full")}</Drawer.Body>
            <Drawer.Footer className="grid grid-cols-2 gap-2">
              <Button variant="tertiary" className="min-h-11" isDisabled={!filtersActive} onPress={reset}>Reset</Button>
              <Button variant="primary" className="min-h-11" onPress={filterDrawer.close}>Show {filtered.length} booking{filtered.length === 1 ? "" : "s"}</Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>

      <UpdateStatusModal booking={target} initial={initialStatus} isOpen={statusModal.isOpen} onOpenChange={statusModal.setOpen} onCancelBooking={(booking) => { setTarget(booking); cancelDialog.open(); }} onConfirm={(booking, next) => patch(booking.reference, { status: next })} />
      <CancelBookingDialog booking={target} isOpen={cancelDialog.isOpen} onOpenChange={cancelDialog.setOpen} onConfirm={(booking, reason) => patch(booking.reference, { status: "cancelled", cancelledAt: new Date(NOW).toISOString(), cancelReason: reason.trim() || "Cancelled by an admin." })} />
    </AdminPage>
  );
}
