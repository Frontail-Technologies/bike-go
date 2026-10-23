"use client";

import { Button, Drawer, useOverlayState } from "@heroui/react";
import { ArrowCounterClockwiseIcon, CalendarCheckIcon, CarProfileIcon, GridFourIcon, ListIcon, SlidersHorizontalIcon, UserPlusIcon, UsersIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";
import { AdminChartCard, StatusDonutChart } from "@/components/admin/charts";
import { AdminPagination, AdminSearch, AdminSelect, ViewToggle, formatCambodiaDate } from "@/components/admin/controls";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { StatCard } from "@/components/admin/data-display/stat-card";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { AdminPage, ContentSection, PageHeader } from "@/components/admin/layout";
import { AdminCustomerCard, CustomerActions } from "./admin-customer-card";
import { CustomerAvatar } from "./customer-avatar";
import { activeRentals, customerGrowth, customers as seedCustomers, type Customer } from "./customer-data";
import { CustomerEditDrawer } from "./customer-edit-drawer";
import { CustomerGrowthChart } from "./customer-growth-chart";

const PAGE_SIZE = 8;
const all = "all";
type ViewMode = "table" | "cards";

const joinedOptions = [
  { value: all, label: "Joined any time" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "180", label: "Last 6 months" },
];
const activityOptions = [
  { value: all, label: "All activity" },
  { value: "rental", label: "Has active rental" },
  { value: "loans", label: "Has loan applications" },
  { value: "none", label: "No bookings yet" },
];
const NOW = Date.parse("2026-10-23T03:00:00.000Z");

export function CustomerList() {
  const router = useRouter();
  const filterDrawer = useOverlayState();
  const [people, setPeople] = useState<Customer[]>(seedCustomers);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(all);
  const [city, setCity] = useState(all);
  const [joined, setJoined] = useState(all);
  const [activity, setActivity] = useState(all);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<ViewMode>("table");
  const [editing, setEditing] = useState<Customer | null>(null);
  const editDrawer = useOverlayState();

  useEffect(() => { const saved = window.localStorage.getItem("ridego-admin-customer-view"); if (saved === "table" || saved === "cards") startTransition(() => setView(saved)); }, []);
  function changeView(next: ViewMode) { setView(next); window.localStorage.setItem("ridego-admin-customer-view", next); }

  const cities = useMemo(() => [...new Set(people.map((person) => person.city))].sort(), [people]);
  const filtered = useMemo(() => people.filter((person) => {
    const term = search.trim().toLowerCase();
    const age = (NOW - Date.parse(person.joinedAt)) / 86_400_000;
    const rentals = activeRentals(person);
    return (!term || `${person.name} ${person.email} ${person.phone} ${person.reference}`.toLowerCase().includes(term))
      && (status === all || person.status === status) && (city === all || person.city === city)
      && (joined === all || age <= Number(joined))
      && (activity === all || (activity === "rental" && rentals > 0) || (activity === "loans" && person.loans.length > 0) || (activity === "none" && person.bookings.length === 0));
  }), [people, search, status, city, joined, activity]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const activeFilters = [status, city, joined, activity].filter((value) => value !== all).length;
  const filtersActive = Boolean(search || activeFilters);
  const update = (setter: (value: string) => void) => (value: string) => { setter(value); setPage(1); };
  const reset = () => { setSearch(""); setStatus(all); setCity(all); setJoined(all); setActivity(all); setPage(1); };
  const open = (person: Customer) => router.push(`/admin/customers/${person.id}`);
  const edit = (person: Customer) => { setEditing(person); editDrawer.open(); };

  const stats = {
    total: people.length,
    active: people.filter((person) => person.status === "active").length,
    fresh: people.filter((person) => NOW - Date.parse(person.joinedAt) <= 30 * 86_400_000).length,
    renting: people.filter((person) => activeRentals(person) > 0).length,
  };
  const statusChart = [
    { label: "Active", value: stats.active, color: "var(--admin-success)" },
    { label: "Inactive", value: stats.total - stats.active, color: "var(--admin-muted)" },
  ];

  const filterControls = (className?: string) => (
    <>
      <AdminSelect className={className} label="All statuses" value={status} onChange={update(setStatus)} options={[{ value: all, label: "All statuses" }, { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
      <AdminSelect className={className} label="All cities" value={city} onChange={update(setCity)} options={[{ value: all, label: "All cities" }, ...cities.map((value) => ({ value, label: value }))]} />
      <AdminSelect className={className} label="Joined" value={joined} onChange={update(setJoined)} options={joinedOptions} />
      <AdminSelect className={className} label="Activity" value={activity} onChange={update(setActivity)} options={activityOptions} />
    </>
  );

  const columns: ColumnDef<Customer>[] = [
    { accessorKey: "name", header: "Customer", cell: ({ row }) => <div className="flex min-w-48 items-center gap-3"><CustomerAvatar name={row.original.name} size="sm" /><div className="min-w-0"><p className="truncate font-bold leading-tight">{row.original.name}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.reference}</p></div></div> },
    { id: "contact", header: "Contact", accessorFn: (row) => row.email, cell: ({ row }) => <div className="min-w-44"><p className="truncate text-sm">{row.original.email}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.phone}</p></div> },
    { accessorKey: "city", header: "Location" },
    { accessorKey: "joinedAt", header: "Joined", cell: ({ row }) => <span className="whitespace-nowrap">{formatCambodiaDate(row.original.joinedAt)}</span> },
    { id: "bookings", header: "Bookings", accessorFn: (row) => row.bookings.length, cell: ({ row }) => <div className="flex items-center gap-2 font-semibold tabular-nums">{row.original.bookings.length}{activeRentals(row.original) ? <span className="inline-flex items-center gap-1 rounded-full bg-[var(--admin-info-soft)] px-2 py-0.5 text-[11px] font-bold text-[var(--admin-info)]"><span className="size-1.5 rounded-full bg-current" aria-hidden />Active</span> : null}</div> },
    { id: "loans", header: "Loans", accessorFn: (row) => row.loans.length, cell: ({ row }) => <span className="font-semibold tabular-nums">{row.original.loans.length}</span> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <AdminStatusBadge status={row.original.status} /> },
  ];

  const empty = <p className="py-12 text-center text-sm text-[var(--admin-muted)]">No customers match these filters.</p>;
  const pagination = <div className="border-t border-[var(--admin-border)]"><AdminPagination page={safePage} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} /></div>;

  return (
    <AdminPage>
      <PageHeader title="Customers" description="Manage customers, view their bookings, loan applications and account status." />

      <section aria-label="Customer overview" className="grid gap-5 xl:grid-cols-[minmax(0,1.9fr)_minmax(300px,1fr)]">
        <div className="grid grid-cols-2 gap-3 xl:col-span-2 xl:grid-cols-4">
          <StatCard tone="info" label="Total Customers" value={stats.total} icon={<UsersIcon size={22} weight="duotone" />} trend={{ direction: "up", value: "6%" }} />
          <StatCard tone="success" label="Active Customers" value={stats.active} icon={<CarProfileIcon size={22} weight="duotone" />} secondary={`${stats.total - stats.active} inactive`} />
          <StatCard tone="accent" label="New (30 days)" value={stats.fresh} icon={<UserPlusIcon size={22} weight="duotone" />} trend={{ direction: "up", value: "12%" }} />
          <StatCard tone="warning" label="Active Rentals" value={stats.renting} icon={<CalendarCheckIcon size={22} weight="duotone" />} secondary="customers on the road" />
        </div>
        <AdminChartCard title="Customer Growth" description="Registered customers, January to October."><CustomerGrowthChart data={customerGrowth} /></AdminChartCard>
        <AdminChartCard title="Account Status" description="Share of active and inactive accounts."><StatusDonutChart compact data={statusChart} centerLabel="Customers" /></AdminChartCard>
      </section>

      <ContentSection className="overflow-visible">
        <div className="space-y-3 border-b border-[var(--admin-border)] p-4">
          <div className="flex items-center gap-2">
            <AdminSearch className="w-auto min-w-0 max-w-none flex-1 basis-0 sm:max-w-xl" value={search} onChange={update(setSearch)} placeholder="Search customers by name, email, phone…" />
            <Button variant="outline" className="relative min-h-11 shrink-0 lg:hidden" onPress={filterDrawer.open} aria-label={`Filters${activeFilters ? `, ${activeFilters} active` : ""}`}>
              <SlidersHorizontalIcon size={18} /><span className="max-sm:sr-only">Filters</span>
              {activeFilters ? <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--admin-accent)] text-[11px] font-extrabold text-[#111820]">{activeFilters}</span> : null}
            </Button>
            <div className="ml-auto"><ViewToggle label="Customer view" value={view} onChange={changeView} options={[{ value: "table", label: "Table", icon: <ListIcon size={17} /> }, { value: "cards", label: "Cards", icon: <GridFourIcon size={17} /> }]} /></div>
          </div>
          <div className="hidden flex-wrap items-center gap-2 lg:flex">
            {filterControls()}
            {filtersActive ? <Button size="sm" variant="ghost" className="min-h-10" onPress={reset}><ArrowCounterClockwiseIcon size={15} />Reset filters</Button> : null}
            <p className="ml-auto text-xs font-semibold text-[var(--admin-muted)]" aria-live="polite">{filtered.length} customer{filtered.length === 1 ? "" : "s"}</p>
          </div>
        </div>

        {view === "table" ? (
          <>
            <div className="hidden md:block">
              <AdminDataTable columns={columns} data={rows} label="Customers" emptyState="No customers match these filters." showPagination={false} pagination={{ page: safePage, pageSize: PAGE_SIZE, total: filtered.length, onPageChange: setPage }} onRowNavigate={open} rowActions={(person) => <CustomerActions customer={person} onView={() => open(person)} onEdit={() => edit(person)} />} />
            </div>
            <ul className="divide-y divide-[var(--admin-border)] md:hidden" aria-label="Customers">
              {rows.map((person) => (
                <li key={person.id} className="flex items-center gap-1 pr-1">
                  <button type="button" onClick={() => open(person)} className="flex min-h-[76px] min-w-0 flex-1 items-center gap-3 p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--admin-accent-strong)]">
                    <CustomerAvatar name={person.name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{person.name}</span>
                      <span className="block truncate text-xs text-[var(--admin-muted)]">{person.email}</span>
                      <span className="mt-1.5 flex items-center gap-2 text-xs text-[var(--admin-muted)]"><AdminStatusBadge status={person.status} />{person.bookings.length} bookings · {person.city}</span>
                    </span>
                  </button>
                  <CustomerActions customer={person} onView={() => open(person)} onEdit={() => edit(person)} />
                </li>
              ))}
              {!rows.length ? <li>{empty}</li> : null}
            </ul>
            {pagination}
          </>
        ) : (
          <>
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3 2xl:grid-cols-4">
              {rows.map((person) => <AdminCustomerCard key={person.id} customer={person} onView={() => open(person)} onEdit={() => edit(person)} />)}
              {!rows.length ? <div className="col-span-full">{empty}</div> : null}
            </div>
            {pagination}
          </>
        )}
      </ContentSection>

      <Drawer.Backdrop isOpen={filterDrawer.isOpen} onOpenChange={filterDrawer.setOpen} className="adminOverlay">
        <Drawer.Content placement="bottom" className="mx-auto w-full max-w-lg rounded-t-3xl">
          <Drawer.Dialog aria-label="Filter customers">
            <Drawer.CloseTrigger />
            <Drawer.Header><Drawer.Heading>Filter customers</Drawer.Heading></Drawer.Header>
            <Drawer.Body className="grid gap-3">{filterControls("w-full")}</Drawer.Body>
            <Drawer.Footer className="grid grid-cols-2 gap-2">
              <Button variant="tertiary" className="min-h-11" isDisabled={!filtersActive} onPress={reset}>Reset</Button>
              <Button variant="primary" className="min-h-11" onPress={filterDrawer.close}>Show {filtered.length} customer{filtered.length === 1 ? "" : "s"}</Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>

      <CustomerEditDrawer customer={editing} isOpen={editDrawer.isOpen} onOpenChange={editDrawer.setOpen} onSave={(id, values) => setPeople((current) => current.map((person) => person.id === id ? { ...person, ...values } : person))} />
    </AdminPage>
  );
}
