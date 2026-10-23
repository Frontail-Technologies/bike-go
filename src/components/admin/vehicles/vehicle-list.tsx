"use client";

import { Button, Dropdown, Label } from "@heroui/react";
import { DotsThreeVerticalIcon, EyeIcon, GridFourIcon, ListIcon, NotePencilIcon, PlusIcon, PowerIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { adminVehicles, type AdminVehicle, type VehicleStatus, type VehicleType } from "@/components/admin/data";
import { AdminPagination, AdminSearch, AdminSelect, FilterBar } from "@/components/admin/controls";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { MoneyDisplay } from "@/components/admin/data-display/misc";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { ConfirmationDialog } from "@/components/admin/feedback";
import { AdminPage, ContentSection, PageHeader } from "@/components/admin/layout";
import { AdminVehicleCard } from "./admin-vehicle-card";

const PAGE_SIZE = 10;
const all = "all";
type ViewMode = "table" | "cards";

export function VehicleList() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState(adminVehicles);
  const [search, setSearch] = useState("");
  const [type, setType] = useState(all);
  const [category, setCategory] = useState(all);
  const [status, setStatus] = useState(all);
  const [location, setLocation] = useState(all);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<ViewMode>("table");
  const [changing, setChanging] = useState<AdminVehicle | null>(null);
  const [mutationError, setMutationError] = useState("");

  useEffect(() => { const saved = window.localStorage.getItem("ridego-admin-vehicle-view"); if (saved === "table" || saved === "cards") setView(saved); }, []);
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
  const filtersActive = Boolean(search || type !== all || category !== all || status !== all || location !== all);
  function updateFilter(setter: (value: string) => void, value: string) { setter(value); setPage(1); }
  function resetFilters() { setSearch(""); setType(all); setCategory(all); setStatus(all); setLocation(all); setPage(1); }
  function toggleVehicle() { if (!changing) return; setMutationError(""); setVehicles((current) => current.map((vehicle) => vehicle.id === changing.id ? { ...vehicle, status: changing.status === "inactive" ? "available" : "inactive" } : vehicle)); setChanging(null); }
  function openToggle(vehicle: AdminVehicle) { setChanging(vehicle); }

  const columns: ColumnDef<AdminVehicle>[] = [
    { accessorKey: "name", header: "Vehicle", cell: ({ row }) => <div className="flex min-w-56 items-center gap-3"><div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]">{row.original.images[0]?.url ? <Image src={row.original.images[0].url} alt={row.original.images[0].altText ?? row.original.name} fill className="object-cover" /> : <span className="flex size-full items-center justify-center text-[var(--admin-muted)]"><GridFourIcon size={19} /></span>}</div><div><p className="font-bold">{row.original.name}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.registrationNumber}</p></div></div> },
    { accessorKey: "vehicleType", header: "Type", cell: ({ row }) => <span className="capitalize">{row.original.vehicleType}</span> },
    { id: "brandModel", header: "Brand / model", accessorFn: (row) => `${row.brand} ${row.model}` },
    { id: "location", header: "Location", accessorFn: (row) => row.location.name, cell: ({ row }) => <div><p>{row.original.location.name}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.location.city}</p></div> },
    { accessorKey: "dailyRentalPriceMinor", header: "Daily price", cell: ({ row }) => <MoneyDisplay amount={row.original.dailyRentalPriceMinor} /> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <AdminStatusBadge status={row.original.status} /> },
  ];

  return <AdminPage>
    <PageHeader title="Vehicles" description="Manage RideGo vehicles, pricing, location assignment, and availability." actions={<Button onPress={() => router.push("/admin/vehicles/new")} variant="primary"><PlusIcon />Add Vehicle</Button>} />
    <ContentSection>
      <FilterBar search={<AdminSearch className="sm:max-w-xl" value={search} onChange={(value) => updateFilter(setSearch, value)} placeholder="Search vehicles…" />} actions={<div className="flex items-center gap-2"><span className="hidden text-xs font-semibold text-[var(--admin-muted)] sm:inline">View</span><div className="flex rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-0.5"><Button size="sm" variant={view === "table" ? "primary" : "ghost"} aria-pressed={view === "table"} aria-label="Table view" onPress={() => changeView("table")}><ListIcon size={16} />Table</Button><Button size="sm" variant={view === "cards" ? "primary" : "ghost"} aria-pressed={view === "cards"} aria-label="Cards view" onPress={() => changeView("cards")}><GridFourIcon size={16} />Cards</Button></div></div>}>
        <AdminSelect label="All types" value={type} onChange={(value) => updateFilter(setType, value)} options={[{ value: all, label: "All types" }, ...(["motorcycle", "scooter", "car", "other"] as VehicleType[]).map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))]} />
        <AdminSelect label="All categories" value={category} onChange={(value) => updateFilter(setCategory, value)} options={[{ value: all, label: "All categories" }, ...categories.map((value) => ({ value, label: value }))]} />
        <AdminSelect label="All statuses" value={status} onChange={(value) => updateFilter(setStatus, value)} options={[{ value: all, label: "All statuses" }, ...(["available", "rented", "maintenance", "inactive"] as VehicleStatus[]).map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))]} />
        <AdminSelect label="All locations" value={location} onChange={(value) => updateFilter(setLocation, value)} options={[{ value: all, label: "All locations" }, ...locations.map((value) => ({ value: value.id, label: value.name }))]} />
        {filtersActive ? <Button size="sm" variant="ghost" onPress={resetFilters}>Reset filters</Button> : null}
      </FilterBar>
      {mutationError ? <p role="alert" className="border-b border-[var(--admin-border)] px-5 py-3 text-sm font-semibold text-[var(--admin-danger)]">{mutationError}</p> : null}
      {view === "table" ? <AdminDataTable columns={columns} data={rows} label="Vehicles" emptyState="No vehicles match these filters." pagination={{ page: safePage, pageSize: PAGE_SIZE, total: filtered.length, onPageChange: setPage }} rowActions={(vehicle) => <Dropdown><Button isIconOnly size="sm" variant="ghost" aria-label={`Actions for ${vehicle.name}`}><DotsThreeVerticalIcon size={18} /></Button><Dropdown.Popover className="adminOverlay"><Dropdown.Menu aria-label={`Actions for ${vehicle.name}`}><Dropdown.Item id="view" textValue="View vehicle" onAction={() => router.push(`/admin/vehicles/${vehicle.id}`)}><EyeIcon size={16} /><Label>View vehicle</Label></Dropdown.Item><Dropdown.Item id="edit" textValue="Edit vehicle" onAction={() => router.push(`/admin/vehicles/${vehicle.id}/edit`)}><NotePencilIcon size={16} /><Label>Edit vehicle</Label></Dropdown.Item><Dropdown.Item id="toggle" textValue={vehicle.status === "inactive" ? "Activate vehicle" : "Deactivate vehicle"} variant={vehicle.status === "inactive" ? "default" : "danger"} onAction={() => openToggle(vehicle)}><PowerIcon size={16} /><Label>{vehicle.status === "inactive" ? "Activate vehicle" : "Deactivate vehicle"}</Label></Dropdown.Item></Dropdown.Menu></Dropdown.Popover></Dropdown>} /> : <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{rows.map((vehicle) => <AdminVehicleCard key={vehicle.id} vehicle={vehicle} onView={() => router.push(`/admin/vehicles/${vehicle.id}`)} onEdit={() => router.push(`/admin/vehicles/${vehicle.id}/edit`)} onToggle={() => openToggle(vehicle)} />)}{!rows.length ? <p className="col-span-full py-12 text-center text-sm text-[var(--admin-muted)]">No vehicles match these filters.</p> : null}</div>}
      {view === "cards" && filtered.length > PAGE_SIZE ? <div className="border-t border-[var(--admin-border)]"><AdminPagination page={safePage} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} /></div> : null}
    </ContentSection>
    <ConfirmationDialog isOpen={Boolean(changing)} onOpenChange={(open) => !open && setChanging(null)} title={changing?.status === "inactive" ? "Activate vehicle?" : "Deactivate vehicle?"} description={changing?.status === "inactive" ? `${changing.name} will return to the available catalogue.` : `${changing?.name ?? "This vehicle"} will no longer be available for new bookings.`} confirmLabel={changing?.status === "inactive" ? "Activate" : "Deactivate"} danger={changing?.status !== "inactive"} onConfirm={toggleVehicle} />
  </AdminPage>;
}
