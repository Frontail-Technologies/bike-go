"use client";

import { Button, Drawer, useOverlayState } from "@heroui/react";
import { ArrowCounterClockwiseIcon, CalendarCheckIcon, CarProfileIcon, GridFourIcon, ListIcon, SlidersHorizontalIcon, UserPlusIcon, UsersIcon } from "@phosphor-icons/react";
import type { ColumnDef, OnChangeFn, SortingState } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { AdminPagination, AdminSearch, AdminSelect, ViewToggle, formatCambodiaDate } from "@/components/admin/controls";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { StatCard } from "@/components/admin/data-display/stat-card";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { AdminErrorState } from "@/components/admin/feedback";
import { AdminPage, ContentSection, PageHeader } from "@/components/admin/layout";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/error";
import { CUSTOMER_PAGE_SIZE, useCustomerListState } from "../hooks/use-customer-list-state";
import { useCustomerLoader, useCustomerStatsQuery, useCustomersQuery } from "../hooks/use-customers";
import type { Customer, CustomerStatus, CustomerSummary, JoinedWindow } from "../types/customer";
import { AdminCustomerCard, CustomerActions } from "./admin-customer-card";
import { CustomerEditDrawer } from "./customer-edit-drawer";

const all = "all";
type ViewMode = "table" | "cards";

const joinedOptions = [
  { value: all, label: "Joined any time" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "180", label: "Last 6 months" },
];

export function CustomerList() {
  const router = useRouter();
  const filterDrawer = useOverlayState();
  const editDrawer = useOverlayState();
  const state = useCustomerListState();
  const { params } = state;
  const query = useCustomersQuery(params);
  const stats = useCustomerStatsQuery();
  const loadCustomer = useCustomerLoader();
  const [view, setView] = useState<ViewMode>("table");
  const [searchText, setSearchText] = useState(params.q ?? "");
  const [editing, setEditing] = useState<Customer | null>(null);

  useEffect(() => { const saved = window.localStorage.getItem("ridego-admin-customer-view"); if (saved === "table" || saved === "cards") startTransition(() => setView(saved)); }, []);
  // The URL is the source of truth; keep the input in step when it changes from outside (reset, back/forward).
  useEffect(() => { startTransition(() => setSearchText(params.q ?? "")); }, [params.q]);
  useEffect(() => {
    if (searchText.trim() === (params.q ?? "")) return;
    const timer = window.setTimeout(() => state.setFilters({ q: searchText.trim() || undefined }), 300);
    return () => window.clearTimeout(timer);
  }, [searchText]);
  function changeView(next: ViewMode) { setView(next); window.localStorage.setItem("ridego-admin-customer-view", next); }

  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;
  const pageCount = Math.max(1, query.data?.meta.totalPages ?? 1);
  const page = Math.min(params.page, pageCount);
  const open = (person: CustomerSummary) => router.push(`/admin/customers/${person.id}`);
  const activeFilters = [params.status, params.city, params.joined].filter(Boolean).length;
  const filtersActive = Boolean(params.q || activeFilters);
  const reset = () => { setSearchText(""); state.reset(); };

  // The list is lightweight, so editing loads the full profile before opening the form.
  async function edit(person: CustomerSummary) {
    try {
      setEditing(await loadCustomer(person.id));
      editDrawer.open();
    } catch (error) {
      toast.danger(error instanceof ApiError ? error.message : "The customer could not be loaded.");
    }
  }

  // Backend sorts: name (A–Z) and joined date (newest by default).
  const sorting: SortingState = params.sort === "name" ? [{ id: "name", desc: false }] : params.sort === "oldest" ? [{ id: "joined", desc: false }] : params.sort === "newest" ? [{ id: "joined", desc: true }] : [];
  const changeSorting: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    state.setFilters({ sort: next[0]?.id === "name" ? "name" : next[0]?.id === "joined" ? (next[0].desc ? "newest" : "oldest") : undefined });
  };

  const filterControls = (className?: string) => (
    <>
      <AdminSelect className={className} label="All statuses" value={params.status ?? all} onChange={(value) => state.setFilters({ status: value === all ? undefined : (value as CustomerStatus) })} options={[{ value: all, label: "All statuses" }, { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
      <AdminSelect className={className} label="All cities" value={params.city ?? all} onChange={(value) => state.setFilters({ city: value === all ? undefined : value })} options={[{ value: all, label: "All cities" }, ...(stats.data?.cities ?? []).map((value) => ({ value, label: value }))]} />
      <AdminSelect className={className} label="Joined" value={params.joined ?? all} onChange={(value) => state.setFilters({ joined: value === all ? undefined : (value as JoinedWindow) })} options={joinedOptions} />
    </>
  );

  const columns: ColumnDef<CustomerSummary>[] = [
    { id: "name", header: "Customer", accessorFn: (row) => row.name, cell: ({ row }) => <div className="flex min-w-48 items-center gap-3"><CustomerAvatar name={row.original.name} size="sm" /><div className="min-w-0"><p className="truncate font-bold leading-tight">{row.original.name}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.reference}</p></div></div> },
    { id: "contact", header: "Contact", enableSorting: false, accessorFn: (row) => row.phone, cell: ({ row }) => <div className="min-w-44"><p className="text-sm font-medium">{row.original.phone ?? "—"}</p><p className="truncate text-xs text-[var(--admin-muted)]">{row.original.email ?? "—"}</p></div> },
    { id: "city", header: "Location", enableSorting: false, accessorFn: (row) => row.city, cell: ({ row }) => row.original.city ?? "—" },
    { id: "joined", header: "Joined", accessorFn: (row) => row.createdAt, cell: ({ row }) => <span className="whitespace-nowrap">{formatCambodiaDate(row.original.createdAt)}</span> },
    { id: "bookings", header: "Bookings", enableSorting: false, accessorFn: (row) => row.bookingCount, cell: ({ row }) => <div className="flex items-center gap-2 font-semibold tabular-nums">{row.original.bookingCount}{row.original.activeRentals ? <span className="inline-flex items-center gap-1 rounded-full bg-[var(--admin-info-soft)] px-2 py-0.5 text-[11px] font-bold text-[var(--admin-info)]"><span className="size-1.5 rounded-full bg-current" aria-hidden />Active</span> : null}</div> },
    { id: "loans", header: "Loans", enableSorting: false, accessorFn: (row) => row.loanCount, cell: ({ row }) => <span className="font-semibold tabular-nums">{row.original.loanCount}</span> },
    { id: "status", header: "Status", enableSorting: false, accessorFn: (row) => row.status, cell: ({ row }) => <AdminStatusBadge status={row.original.status} /> },
  ];

  const emptyText = query.isLoading ? "Loading customers…" : filtersActive ? "No customers match these filters." : "No customers yet.";
  const empty = <p className="py-12 text-center text-sm text-[var(--admin-muted)]">{emptyText}</p>;
  const summary = stats.data;

  if (query.isError && !query.data) return <AdminPage><PageHeader title="Customers" description="Manage customers, view their bookings, loan applications and account status." /><AdminErrorState title="Couldn’t load customers" description={query.error instanceof ApiError ? query.error.message : "Try again in a moment."} onRetry={() => void query.refetch()} /></AdminPage>;

  return (
    <AdminPage>
      <PageHeader title="Customers" description="Manage customers, view their bookings, loan applications and account status." />

      <section aria-label="Customer overview" aria-busy={stats.isLoading} className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard loading={stats.isLoading} tone="info" label="Total Customers" value={summary?.total ?? 0} icon={<UsersIcon size={22} weight="duotone" />} />
        <StatCard loading={stats.isLoading} tone="success" label="Active Customers" value={summary?.active ?? 0} icon={<CarProfileIcon size={22} weight="duotone" />} secondary={`${summary?.inactive ?? 0} inactive`} />
        <StatCard loading={stats.isLoading} tone="accent" label="New (30 days)" value={summary?.newLast30Days ?? 0} icon={<UserPlusIcon size={22} weight="duotone" />} />
        <StatCard loading={stats.isLoading} tone="warning" label="Active Rentals" value={summary?.withActiveRentals ?? 0} icon={<CalendarCheckIcon size={22} weight="duotone" />} secondary="customers on the road" />
      </section>

      <ContentSection className="overflow-visible">
        <div className="space-y-3 border-b border-[var(--admin-border)] p-4">
          <div className="flex items-center gap-2">
            <AdminSearch className="w-auto min-w-0 max-w-none flex-1 basis-0 sm:max-w-xl" value={searchText} onChange={setSearchText} placeholder="Search customers by name, email, phone…" />
            <Button variant="outline" className="relative min-h-11 shrink-0 lg:hidden" onPress={filterDrawer.open} aria-label={`Filters${activeFilters ? `, ${activeFilters} active` : ""}`}>
              <SlidersHorizontalIcon size={18} /><span className="max-sm:sr-only">Filters</span>
              {activeFilters ? <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--admin-accent)] text-[11px] font-extrabold text-[#111820]">{activeFilters}</span> : null}
            </Button>
            <div className="ml-auto"><ViewToggle label="Customer view" value={view} onChange={changeView} options={[{ value: "table", label: "Table", icon: <ListIcon size={17} /> }, { value: "cards", label: "Cards", icon: <GridFourIcon size={17} /> }]} /></div>
          </div>
          <div className="hidden flex-wrap items-center gap-2 lg:flex">
            {filterControls()}
            {filtersActive ? <Button size="sm" variant="ghost" className="min-h-10" onPress={reset}><ArrowCounterClockwiseIcon size={15} />Reset filters</Button> : null}
            <p className="ml-auto text-xs font-semibold text-[var(--admin-muted)]" aria-live="polite">{total} customer{total === 1 ? "" : "s"}</p>
          </div>
        </div>

        {view === "table" ? (
          <AdminDataTable columns={columns} data={rows} label="Customers" emptyState={emptyText} pagination={{ page, pageSize: CUSTOMER_PAGE_SIZE, total, onPageChange: state.setPage }} manualSorting sorting={sorting} onSortingChange={changeSorting} loading={query.isLoading} onRowNavigate={open} rowActions={(person) => <CustomerActions customer={person} onView={() => open(person)} onEdit={() => void edit(person)} />} minWidth={880} />
        ) : (
          <>
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3 2xl:grid-cols-4">
              {rows.map((person) => <AdminCustomerCard key={person.id} customer={person} onView={() => open(person)} onEdit={() => void edit(person)} />)}
              {!rows.length ? <div className="col-span-full">{empty}</div> : null}
            </div>
            <div className="border-t border-[var(--admin-border)]"><AdminPagination page={page} pageCount={pageCount} total={total} pageSize={CUSTOMER_PAGE_SIZE} onPageChange={state.setPage} /></div>
          </>
        )}
      </ContentSection>

      <Drawer.Backdrop isOpen={filterDrawer.isOpen} onOpenChange={filterDrawer.setOpen} className="adminOverlay">
        <Drawer.Content placement="right" className="w-full max-w-md">
          <Drawer.Dialog aria-label="Filter customers">
            <Drawer.CloseTrigger />
            <Drawer.Header><Drawer.Heading>Filter customers</Drawer.Heading></Drawer.Header>
            <Drawer.Body className="grid gap-3">{filterControls("w-full")}</Drawer.Body>
            <Drawer.Footer className="grid grid-cols-2 gap-2">
              <Button variant="tertiary" className="min-h-11" isDisabled={!filtersActive} onPress={reset}>Reset</Button>
              <Button variant="primary" className="min-h-11" onPress={filterDrawer.close}>Show {total} customer{total === 1 ? "" : "s"}</Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>

      <CustomerEditDrawer customer={editing} isOpen={editDrawer.isOpen} onOpenChange={editDrawer.setOpen} />
    </AdminPage>
  );
}
