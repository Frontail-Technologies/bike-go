"use client";

import { Button, Drawer, useOverlayState } from "@heroui/react";
import { ArrowCounterClockwiseIcon, GridFourIcon, ListIcon, PlusIcon, SlidersHorizontalIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";
import { adminVehicles, type AdminVehicle, type VehicleStatus, type VehicleType } from "@/components/admin/data";
import { AdminPagination, AdminSearch, AdminSelect, ViewToggle } from "@/components/admin/controls";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { MoneyDisplay } from "@/components/admin/data-display/misc";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { ConfirmationDialog } from "@/components/admin/feedback";
import { AdminPage, ContentSection, PageHeader } from "@/components/admin/layout";
import { AdminVehicleCard } from "./admin-vehicle-card";
import { VehicleActions } from "./vehicle-actions";
import { VehiclePhoto } from "./vehicle-photo";

const PAGE_SIZE = 10;
const all = "all";
type ViewMode = "table" | "cards";

const cap = (value: string) => value[0].toUpperCase() + value.slice(1);

export function VehicleList() {
  const router = useRouter();
  const filterDrawer = useOverlayState();
  const [vehicles, setVehicles] = useState(adminVehicles);
  const [search, setSearch] = useState("");
  const [type, setType] = useState(all);
  const [category, setCategory] = useState(all);
  const [status, setStatus] = useState(all);
  const [location, setLocation] = useState(all);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<ViewMode>("table");
  const [changing, setChanging] = useState<AdminVehicle | null>(null);

  useEffect(() => { const saved = window.localStorage.getItem("ridego-admin-vehicle-view"); if (saved === "table" || saved === "cards") startTransition(() => setView(saved)); }, []);
  function changeView(next: ViewMode) { setView(next); window.localStorage.setItem("ridego-admin-vehicle-view", next); }
  const locations = useMemo(() => [...new Map(vehicles.map((vehicle) => [vehicle.location.id, vehicle.location])).values()], [vehicles]);
  const categories = useMemo(() => [...new Set(vehicles.map((vehicle) => vehicle.category))].sort(), [vehicles]);
  const filtered = useMemo(() => vehicles.filter((vehicle) => {
    const term = search.trim().toLowerCase();
    return (!term || `${vehicle.name} ${vehicle.brand} ${vehicle.model} ${vehicle.registrationNumber}`.toLowerCase().includes(term)) && (type === all || vehicle.vehicleType === type) && (category === all || vehicle.category === category) && (status === all || vehicle.status === status) && (location === all || vehicle.location.id === location);
  }), [vehicles, search, type, category, status, location]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const activeFilters = [type, category, status, location].filter((value) => value !== all).length;
  const filtersActive = Boolean(search || activeFilters);
  function updateFilter(setter: (value: string) => void, value: string) { setter(value); setPage(1); }
  function resetFilters() { setSearch(""); setType(all); setCategory(all); setStatus(all); setLocation(all); setPage(1); }
  function toggleVehicle() { if (!changing) return; setVehicles((current) => current.map((vehicle) => vehicle.id === changing.id ? { ...vehicle, status: changing.status === "inactive" ? "available" : "inactive" } : vehicle)); setChanging(null); }
  const open = (vehicle: AdminVehicle) => router.push(`/admin/vehicles/${vehicle.id}`);
  const edit = (vehicle: AdminVehicle) => router.push(`/admin/vehicles/${vehicle.id}/edit`);

  const filterControls = (className?: string) => (
    <>
      <AdminSelect className={className} label="All types" value={type} onChange={(value) => updateFilter(setType, value)} options={[{ value: all, label: "All types" }, ...(["motorcycle", "scooter", "car", "other"] as VehicleType[]).map((value) => ({ value, label: cap(value) }))]} />
      <AdminSelect className={className} label="All categories" value={category} onChange={(value) => updateFilter(setCategory, value)} options={[{ value: all, label: "All categories" }, ...categories.map((value) => ({ value, label: value }))]} />
      <AdminSelect className={className} label="All statuses" value={status} onChange={(value) => updateFilter(setStatus, value)} options={[{ value: all, label: "All statuses" }, ...(["available", "rented", "maintenance", "inactive"] as VehicleStatus[]).map((value) => ({ value, label: cap(value) }))]} />
      <AdminSelect className={className} label="All locations" value={location} onChange={(value) => updateFilter(setLocation, value)} options={[{ value: all, label: "All locations" }, ...locations.map((value) => ({ value: value.id, label: value.name }))]} />
    </>
  );

  const columns: ColumnDef<AdminVehicle>[] = [
    { accessorKey: "name", header: "Vehicle", cell: ({ row }) => (
      <div className="flex min-w-56 items-center gap-3">
        <VehiclePhoto vehicle={row.original} className="h-12 w-[66px] shrink-0 rounded-xl border border-[var(--admin-border)]" sizes="66px" />
        <div className="min-w-0"><p className="truncate font-bold leading-tight">{row.original.name}</p><p className="mt-0.5 text-xs text-[var(--admin-muted)]">{row.original.registrationNumber}</p></div>
      </div>
    ) },
    { accessorKey: "vehicleType", header: "Type", cell: ({ row }) => <span className="capitalize">{row.original.vehicleType}</span> },
    { id: "brandModel", header: "Brand / model", accessorFn: (row) => `${row.brand} ${row.model}` },
    { id: "location", header: "Location", accessorFn: (row) => row.location.name, cell: ({ row }) => <div><p className="font-medium">{row.original.location.name}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.location.city}</p></div> },
    { accessorKey: "dailyRentalPriceMinor", header: "Daily price", cell: ({ row }) => <MoneyDisplay amount={row.original.dailyRentalPriceMinor} /> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <AdminStatusBadge status={row.original.status} /> },
  ];

  const empty = <p className="py-12 text-center text-sm text-[var(--admin-muted)]">No vehicles match these filters.</p>;

  return <AdminPage>
    <PageHeader title="Vehicles" description="Manage your vehicles, pricing, location assignment, and availability." actions={<Button onPress={() => router.push("/admin/vehicles/new")} variant="primary" className="min-h-11"><PlusIcon />Add Vehicle</Button>} />
    <ContentSection className="overflow-visible">
      <div className="space-y-3 border-b border-[var(--admin-border)] p-4">
        <div className="flex items-center gap-2">
          <AdminSearch className="w-auto min-w-0 max-w-none flex-1 basis-0 sm:max-w-xl" value={search} onChange={(value) => updateFilter(setSearch, value)} placeholder="Search vehicles…" />
          <Button variant="outline" className="relative min-h-11 shrink-0 lg:hidden" onPress={filterDrawer.open} aria-label={`Filters${activeFilters ? `, ${activeFilters} active` : ""}`}>
            <SlidersHorizontalIcon size={18} /><span className="max-sm:sr-only">Filters</span>
            {activeFilters ? <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--admin-accent)] text-[11px] font-extrabold text-[#111820]">{activeFilters}</span> : null}
          </Button>
          <div className="ml-auto"><ViewToggle value={view} onChange={changeView} options={[{ value: "table", label: "Table", icon: <ListIcon size={17} /> }, { value: "cards", label: "Cards", icon: <GridFourIcon size={17} /> }]} /></div>
        </div>
        <div className="hidden flex-wrap items-center gap-2 lg:flex">
          {filterControls()}
          {filtersActive ? <Button size="sm" variant="ghost" className="min-h-10" onPress={resetFilters}><ArrowCounterClockwiseIcon size={15} />Reset filters</Button> : null}
          <p className="ml-auto text-xs font-semibold text-[var(--admin-muted)]" aria-live="polite">{filtered.length} vehicle{filtered.length === 1 ? "" : "s"}</p>
        </div>
      </div>

      {view === "table" ? (
        <>
          <div className="hidden md:block">
            <AdminDataTable columns={columns} data={rows} label="Vehicles" emptyState="No vehicles match these filters." pagination={{ page: safePage, pageSize: PAGE_SIZE, total: filtered.length, onPageChange: setPage }} showPagination={false} onRowNavigate={open} rowActions={(vehicle) => <VehicleActions vehicle={vehicle} onView={() => open(vehicle)} onEdit={() => edit(vehicle)} onToggle={() => setChanging(vehicle)} />} />
          </div>
          <ul className="divide-y divide-[var(--admin-border)] md:hidden" aria-label="Vehicles">
            {rows.map((vehicle) => (
              <li key={vehicle.id} className="flex items-center gap-1 pr-1">
                <button type="button" onClick={() => open(vehicle)} className="flex min-h-[76px] min-w-0 flex-1 items-center gap-3 p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--admin-accent-strong)]">
                  <VehiclePhoto vehicle={vehicle} className="h-14 w-20 shrink-0 rounded-xl border border-[var(--admin-border)]" sizes="80px" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{vehicle.name}</span>
                    <span className="block truncate text-xs text-[var(--admin-muted)]">{vehicle.location.city} · {vehicle.registrationNumber}</span>
                    <span className="mt-1.5 flex items-center gap-2"><AdminStatusBadge status={vehicle.status} /><MoneyDisplay amount={vehicle.dailyRentalPriceMinor} className="text-sm" /></span>
                  </span>
                </button>
                <VehicleActions vehicle={vehicle} onView={() => open(vehicle)} onEdit={() => edit(vehicle)} onToggle={() => setChanging(vehicle)} />
              </li>
            ))}
            {!rows.length ? <li>{empty}</li> : null}
          </ul>
          <div className="border-t border-[var(--admin-border)]"><AdminPagination page={safePage} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} /></div>
        </>
      ) : (
        <>
          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3 2xl:grid-cols-4">
            {rows.map((vehicle) => <AdminVehicleCard key={vehicle.id} vehicle={vehicle} onView={() => open(vehicle)} onEdit={() => edit(vehicle)} onToggle={() => setChanging(vehicle)} />)}
            {!rows.length ? <div className="col-span-full">{empty}</div> : null}
          </div>
          {filtered.length > PAGE_SIZE ? <div className="border-t border-[var(--admin-border)]"><AdminPagination page={safePage} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} /></div> : null}
        </>
      )}
    </ContentSection>

    <Drawer.Backdrop isOpen={filterDrawer.isOpen} onOpenChange={filterDrawer.setOpen} className="adminOverlay">
      <Drawer.Content placement="bottom" className="mx-auto w-full max-w-lg rounded-t-3xl">
        <Drawer.Dialog aria-label="Filter vehicles">
          <Drawer.CloseTrigger />
          <Drawer.Header><Drawer.Heading>Filter vehicles</Drawer.Heading></Drawer.Header>
          <Drawer.Body className="grid gap-3">{filterControls("w-full")}</Drawer.Body>
          <Drawer.Footer className="grid grid-cols-2 gap-2">
            <Button variant="tertiary" className="min-h-11" isDisabled={!filtersActive} onPress={resetFilters}>Reset</Button>
            <Button variant="primary" className="min-h-11" onPress={filterDrawer.close}>Show {filtered.length} vehicle{filtered.length === 1 ? "" : "s"}</Button>
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>

    <ConfirmationDialog isOpen={Boolean(changing)} onOpenChange={(isOpen) => !isOpen && setChanging(null)} title={changing?.status === "inactive" ? "Activate vehicle?" : "Deactivate vehicle?"} description={changing?.status === "inactive" ? `${changing.name} will return to the available catalogue.` : `${changing?.name ?? "This vehicle"} will no longer be available for new bookings.`} confirmLabel={changing?.status === "inactive" ? "Activate" : "Deactivate"} danger={changing?.status !== "inactive"} onConfirm={toggleVehicle} />
  </AdminPage>;
}
