"use client";

import { Button, Drawer, useOverlayState } from "@heroui/react";
import { ArrowCounterClockwiseIcon, GridFourIcon, ListIcon, SlidersHorizontalIcon } from "@phosphor-icons/react";
import type { ColumnDef, OnChangeFn, SortingState } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { PaymentStatusBadge } from "@/components/admin/bookings/booking-parts";
import { AdminPagination, AdminSearch, AdminSelect, ViewToggle } from "@/components/admin/controls";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { AdminErrorState } from "@/components/admin/feedback";
import { AdminPage, ContentSection, PageHeader } from "@/components/admin/layout";
import { CurrencyAmount } from "@/components/admin/money";
import { VehiclePhoto } from "@/components/admin/vehicles/vehicle-photo";
import { useLocationsQuery } from "@/features/admin/locations/hooks/use-locations";
import { ApiError } from "@/lib/api/error";
import { useBookingActions } from "../hooks/use-booking-actions";
import { BOOKING_PAGE_SIZE, useBookingListState } from "../hooks/use-booking-list-state";
import { useBookingsQuery } from "../hooks/use-bookings";
import { useNow } from "../hooks/use-now";
import { bookingLabels, fmtDate, fmtShort, paymentLabels, vehiclePhoto } from "../lib/booking-model";
import { bookingStatuses, paymentStatuses, type Booking, type BookingSort, type BookingStatus, type PaymentStatus, type PickupWindow } from "../types/booking";
import { AdminBookingCard } from "./admin-booking-card";
import { BookingActions, type BookingHandlers, BookingOperationalStatus } from "./booking-actions";
import { CancelBookingDialog, NoShowDialog, UpdateStatusModal } from "./booking-dialogs";

const all = "all";
const overdueValue = "overdue";
type ViewMode = "table" | "cards";

const pickupOptions: Array<{ value: string; label: string }> = [
  { value: all, label: "All dates" },
  { value: "today", label: "Pickup today" },
  { value: "next7", label: "Pickup in next 7 days" },
  { value: "last7", label: "Pickup in last 7 days" },
];

/** Column id → the backend's sort keys for ascending and descending. */
const sortColumns: Record<string, { asc: BookingSort; desc: BookingSort }> = {
  reference: { asc: "oldest", desc: "newest" },
  period: { asc: "pickup_asc", desc: "pickup_desc" },
  amount: { asc: "total_asc", desc: "total_desc" },
};
const sortingFor = (sort: BookingSort | undefined): SortingState => {
  const found = Object.entries(sortColumns).find(([, keys]) => keys.asc === sort || keys.desc === sort);
  return found ? [{ id: found[0], desc: found[1].desc === sort }] : [];
};

export function BookingList() {
  const router = useRouter();
  const now = useNow();
  const filterDrawer = useOverlayState();
  const statusModal = useOverlayState();
  const cancelDialog = useOverlayState();
  const noShowDialog = useOverlayState();
  const state = useBookingListState();
  const { params } = state;
  const query = useBookingsQuery(params);
  const locationsQuery = useLocationsQuery();
  const actions = useBookingActions();
  const [view, setView] = useState<ViewMode>("table");
  const [target, setTarget] = useState<Booking | null>(null);
  const [initialStatus, setInitialStatus] = useState<BookingStatus | null>(null);
  const [searchText, setSearchText] = useState(params.q ?? "");

  useEffect(() => {
    const saved = window.localStorage.getItem("ridego-admin-booking-view");
    const next: ViewMode = saved === "table" || saved === "cards" ? saved : window.innerWidth < 768 ? "cards" : "table";
    startTransition(() => setView(next));
  }, []);
  // The URL is the source of truth; keep the input in step when it changes from outside (reset, back/forward).
  useEffect(() => { startTransition(() => setSearchText(params.q ?? "")); }, [params.q]);
  useEffect(() => {
    if (searchText.trim() === (params.q ?? "")) return;
    const timer = window.setTimeout(() => state.setFilters({ q: searchText.trim() || undefined }), 300);
    return () => window.clearTimeout(timer);
  }, [searchText]);
  function changeView(next: ViewMode) { setView(next); window.localStorage.setItem("ridego-admin-booking-view", next); }

  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;
  const pageCount = Math.max(1, query.data?.meta.totalPages ?? 1);
  const page = Math.min(params.page, pageCount);
  const activeFilters = [params.status ?? (params.overdue ? overdueValue : undefined), params.paymentStatus, params.locationId, params.pickup].filter(Boolean).length;
  const filtersActive = Boolean(params.q || activeFilters);
  const reset = () => { setSearchText(""); state.reset(); };
  const sorting = sortingFor(params.sort);
  const changeSorting: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    const keys = next[0] ? sortColumns[next[0].id] : undefined;
    state.setFilters({ sort: keys ? (next[0]!.desc ? keys.desc : keys.asc) : undefined });
  };

  const handlers: BookingHandlers = {
    onView: (booking) => router.push(`/admin/bookings/${booking.reference}`),
    onAdvance: (booking, next) => { setTarget(booking); setInitialStatus(next); statusModal.open(); },
    onCancel: (booking) => { setTarget(booking); cancelDialog.open(); },
    onNoShow: (booking) => { setTarget(booking); noShowDialog.open(); },
    onOperate: (booking) => router.push(`/admin/bookings/${booking.reference}`),
  };

  const columns: ColumnDef<Booking & { id: string }>[] = [
    { id: "reference", header: "Booking", accessorFn: (row) => row.createdAt, cell: ({ row }) => <div className="min-w-14 whitespace-nowrap"><p className="font-bold">{row.original.reference}</p><p className="text-xs text-[var(--admin-muted)]">{fmtDate(row.original.createdAt).slice(0, 6)}</p></div> },
    { id: "customer", header: "Customer", enableSorting: false, accessorFn: (row) => row.customer.name, cell: ({ row }) => <div className="flex min-w-28 max-w-40 items-center gap-2"><CustomerAvatar name={row.original.customer.name} size="sm" className="size-7 text-[10px]" /><div className="min-w-0"><p className="truncate font-semibold leading-tight">{row.original.customer.name}</p><p className="whitespace-nowrap text-xs text-[var(--admin-muted)]">{row.original.customer.phone ?? row.original.customer.email ?? "—"}</p></div></div> },
    { id: "vehicle", header: "Vehicle", enableSorting: false, accessorFn: (row) => row.vehicle.name, cell: ({ row }) => <div className="flex min-w-32 max-w-40 items-center gap-2.5"><VehiclePhoto vehicle={vehiclePhoto(row.original.vehicle)} className="h-8 w-11 shrink-0 rounded-lg border border-[var(--admin-border)]" sizes="56px" /><div className="min-w-0"><p className="truncate font-semibold leading-tight">{row.original.vehicle.name}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.vehicle.registrationNumber}</p></div></div> },
    { id: "period", header: "Rental period", accessorFn: (row) => row.pickupAt, cell: ({ row }) => <div className="min-w-24 whitespace-nowrap text-xs"><p className="font-medium">{fmtShort(row.original.pickupAt)}</p><p className="text-[var(--admin-muted)]">{fmtShort(row.original.returnAt)}</p></div> },
    { id: "location", header: "Location", enableSorting: false, accessorFn: (row) => row.pickupLocation.name, cell: ({ row }) => <div className="min-w-24 max-w-28 text-xs"><p className="font-medium">{row.original.pickupLocation.name}</p>{row.original.returnLocation.id !== row.original.pickupLocation.id ? <p className="text-[var(--admin-muted)]">Return: {row.original.returnLocation.name}</p> : null}</div> },
    { id: "amount", header: "Amount", accessorFn: (row) => row.pricing.totalPayableMinor, cell: ({ row }) => <CurrencyAmount amount={row.original.pricing.totalPayableMinor} currency={row.original.currency} /> },
    { id: "status", header: "Status", enableSorting: false, accessorFn: (row) => row.bookingStatus, cell: ({ row }) => <BookingOperationalStatus booking={row.original} now={now} /> },
    { id: "payment", header: "Payment", enableSorting: false, accessorFn: (row) => row.paymentStatus, cell: ({ row }) => <PaymentStatusBadge status={row.original.paymentStatus} /> },
  ];
  const data = rows.map((row) => ({ ...row, id: row.reference }));

  const filterControls = (className?: string) => (
    <>
      <AdminSelect className={className} label="All statuses" value={params.overdue ? overdueValue : params.status ?? all} onChange={(value) => state.setFilters(value === overdueValue ? { status: undefined, overdue: true } : { status: value === all ? undefined : (value as BookingStatus), overdue: undefined })} options={[{ value: all, label: "All statuses" }, ...bookingStatuses.map((value) => ({ value, label: bookingLabels[value] })), { value: overdueValue, label: "Overdue" }]} />
      <AdminSelect className={className} label="All payments" value={params.paymentStatus ?? all} onChange={(value) => state.setFilters({ paymentStatus: value === all ? undefined : (value as PaymentStatus) })} options={[{ value: all, label: "All payments" }, ...paymentStatuses.map((value) => ({ value, label: paymentLabels[value] }))]} />
      <AdminSelect className={className} label="All locations" value={params.locationId ?? all} onChange={(value) => state.setFilters({ locationId: value === all ? undefined : value })} options={[{ value: all, label: "All locations" }, ...(locationsQuery.data ?? []).map((location) => ({ value: location.id, label: location.name }))]} />
      <AdminSelect className={className} label="All dates" value={params.pickup ?? all} onChange={(value) => state.setFilters({ pickup: value === all ? undefined : (value as PickupWindow) })} options={pickupOptions} />
    </>
  );

  const emptyText = query.isLoading ? "Loading bookings…" : filtersActive ? "No bookings match these filters." : "No bookings yet.";
  const empty = <p className="py-12 text-center text-sm text-[var(--admin-muted)]">{emptyText}</p>;
  const pagination = <div className="border-t border-[var(--admin-border)]"><AdminPagination page={page} pageCount={pageCount} total={total} pageSize={BOOKING_PAGE_SIZE} onPageChange={state.setPage} /></div>;

  if (query.isError && !query.data) return <AdminPage><PageHeader title="Bookings" description="Manage vehicle bookings, rental status, and customer activity." /><AdminErrorState title="Couldn’t load bookings" description={query.error instanceof ApiError ? query.error.message : "Try again in a moment."} onRetry={() => void query.refetch()} /></AdminPage>;

  return (
    <AdminPage>
      <PageHeader title="Bookings" description="Manage vehicle bookings, rental status, and customer activity." />
      <ContentSection className="overflow-visible">
        <div className="space-y-3 border-b border-[var(--admin-border)] p-4">
          <div className="flex items-center gap-2">
            <AdminSearch className="w-auto min-w-0 max-w-none flex-1 basis-0 sm:max-w-xl" value={searchText} onChange={setSearchText} placeholder="Search booking, customer, vehicle…" />
            <Button variant="outline" className="relative min-h-11 shrink-0 lg:hidden" onPress={filterDrawer.open} aria-label={`Filters${activeFilters ? `, ${activeFilters} active` : ""}`}>
              <SlidersHorizontalIcon size={18} /><span className="max-sm:sr-only">Filters</span>
              {activeFilters ? <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--admin-accent)] text-[11px] font-extrabold text-[#111820]">{activeFilters}</span> : null}
            </Button>
            <div className="ml-auto"><ViewToggle label="Booking view" value={view} onChange={changeView} options={[{ value: "table", label: "Table", icon: <ListIcon size={17} /> }, { value: "cards", label: "Cards", icon: <GridFourIcon size={17} /> }]} /></div>
          </div>
          <div className="hidden flex-wrap items-center gap-2 lg:flex">
            {filterControls()}
            {filtersActive ? <Button size="sm" variant="ghost" className="min-h-10" onPress={reset}><ArrowCounterClockwiseIcon size={15} />Reset filters</Button> : null}
            <p className="ml-auto text-xs font-semibold text-[var(--admin-muted)]" aria-live="polite">{total} booking{total === 1 ? "" : "s"}</p>
          </div>
        </div>

        {view === "table" ? (
          <AdminDataTable columns={columns} data={data} label="Bookings" emptyState={emptyText} pagination={{ page, pageSize: BOOKING_PAGE_SIZE, total, onPageChange: state.setPage }} manualSorting sorting={sorting} onSortingChange={changeSorting} loading={query.isLoading} onRowNavigate={handlers.onView} rowActions={(booking) => <BookingActions booking={booking} handlers={handlers} now={now} />} minWidth={960} />
        ) : (
          <>
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 2xl:grid-cols-3">
              {rows.map((booking) => <AdminBookingCard key={booking.reference} booking={booking} handlers={handlers} now={now} />)}
              {!rows.length ? <div className="col-span-full">{empty}</div> : null}
            </div>
            {pagination}
          </>
        )}
      </ContentSection>

      <Drawer.Backdrop isOpen={filterDrawer.isOpen} onOpenChange={filterDrawer.setOpen} className="adminOverlay">
        <Drawer.Content placement="right" className="w-full max-w-md">
          <Drawer.Dialog aria-label="Filter bookings">
            <Drawer.CloseTrigger />
            <Drawer.Header><Drawer.Heading>Filter bookings</Drawer.Heading></Drawer.Header>
            <Drawer.Body className="grid gap-3">{filterControls("w-full")}</Drawer.Body>
            <Drawer.Footer className="grid grid-cols-2 gap-2">
              <Button variant="tertiary" className="min-h-11" isDisabled={!filtersActive} onPress={reset}>Reset</Button>
              <Button variant="primary" className="min-h-11" onPress={filterDrawer.close}>Show {total} booking{total === 1 ? "" : "s"}</Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>

      <UpdateStatusModal booking={target} initial={initialStatus} isOpen={statusModal.isOpen} onOpenChange={statusModal.setOpen} onConfirm={(booking, next, note) => actions.advance(booking, next, note)} />
      <CancelBookingDialog booking={target} isOpen={cancelDialog.isOpen} onOpenChange={cancelDialog.setOpen} onConfirm={(booking, reason) => actions.advance(booking, "cancelled", reason)} />
      <NoShowDialog booking={target} isOpen={noShowDialog.isOpen} onOpenChange={noShowDialog.setOpen} onConfirm={(booking, reason) => actions.advance(booking, "no_show", reason)} />
    </AdminPage>
  );
}
