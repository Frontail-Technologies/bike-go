"use client";

import { Button } from "@heroui/react";
import { EyeIcon, NotePencilIcon, PlusIcon, PowerIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { adminVehicles, type AdminVehicle, type VehicleStatus, type VehicleType } from "@/components/admin/data";
import { AdminSearch, AdminSelect, FilterBar, TableActions } from "@/components/admin/controls";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { MoneyDisplay } from "@/components/admin/data-display/misc";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { ConfirmationDialog } from "@/components/admin/feedback";
import { AdminPage, ContentSection, PageHeader } from "@/components/admin/layout";

const PAGE_SIZE = 10;
const all = "all";

export function VehicleList() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState(adminVehicles);
  const [search, setSearch] = useState("");
  const [type, setType] = useState(all);
  const [category, setCategory] = useState(all);
  const [status, setStatus] = useState(all);
  const [location, setLocation] = useState(all);
  const [page, setPage] = useState(1);
  const [changing, setChanging] = useState<AdminVehicle | null>(null);
  const [mutationError, setMutationError] = useState("");

  const locations = useMemo(() => [...new Map(vehicles.map((vehicle) => [vehicle.location.id, vehicle.location])).values()], [vehicles]);
  const categories = useMemo(() => [...new Set(vehicles.map((vehicle) => vehicle.category))].sort(), [vehicles]);
  const filtered = useMemo(() => vehicles.filter((vehicle) => {
    const term = search.trim().toLowerCase();
    return (!term || `${vehicle.name} ${vehicle.brand} ${vehicle.model} ${vehicle.registrationNumber}`.toLowerCase().includes(term))
      && (type === all || vehicle.vehicleType === type)
      && (category === all || vehicle.category === category)
      && (status === all || vehicle.status === status)
      && (location === all || vehicle.location.id === location);
  }), [vehicles, search, type, category, status, location]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function updateFilter(setter: (value: string) => void, value: string) { setter(value); setPage(1); }
  async function toggleVehicle() {
    if (!changing) return;
    setMutationError("");
    try {
      setVehicles((current) => current.map((vehicle) => vehicle.id === changing.id ? { ...vehicle, status: changing.status === "inactive" ? "available" : "inactive" } : vehicle));
      setChanging(null);
    } catch (cause) { setMutationError(cause instanceof Error ? cause.message : "Unable to update the vehicle."); setChanging(null); }
  }

  const columns: ColumnDef<AdminVehicle>[] = [
    { accessorKey: "name", header: "Vehicle", cell: ({ row }) => <div className="flex min-w-52 items-center gap-3"><div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-[var(--admin-surface-muted)]">{row.original.images[0]?.url ? <Image src={row.original.images[0].url} alt={row.original.images[0].altText ?? row.original.name} fill className="object-cover" /> : <span className="flex size-full items-center justify-center text-[10px] font-bold text-[var(--admin-muted)]">No image</span>}</div><div><p className="font-bold">{row.original.name}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.registrationNumber}</p></div></div> },
    { accessorKey: "vehicleType", header: "Type", cell: ({ row }) => <span className="capitalize">{row.original.vehicleType}</span> },
    { id: "brandModel", header: "Brand / model", accessorFn: (row) => `${row.brand} ${row.model}` },
    { id: "location", header: "Location", accessorFn: (row) => row.location.name, cell: ({ row }) => <div><p>{row.original.location.name}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.location.city}</p></div> },
    { accessorKey: "dailyRentalPriceMinor", header: "Daily price", cell: ({ row }) => <MoneyDisplay amount={row.original.dailyRentalPriceMinor} currency={row.original.currency} /> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <AdminStatusBadge status={row.original.status} /> },
  ];

  return <AdminPage>
    <PageHeader title="Vehicles" description="Manage RideGo vehicles, pricing, location assignment, and availability." actions={<Button onPress={() => router.push("/admin/vehicles/new")} variant="primary"><PlusIcon />Add Vehicle</Button>} />
    <ContentSection>
      <FilterBar search={<AdminSearch value={search} onChange={(value) => updateFilter(setSearch, value)} placeholder="Search vehicles…" />}>
        <AdminSelect label="All types" value={type} onChange={(value) => updateFilter(setType, value)} options={[{ value: all, label: "All types" }, ...(["motorcycle", "scooter", "car", "other"] as VehicleType[]).map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))]} />
        <AdminSelect label="All categories" value={category} onChange={(value) => updateFilter(setCategory, value)} options={[{ value: all, label: "All categories" }, ...categories.map((value) => ({ value, label: value }))]} />
        <AdminSelect label="All statuses" value={status} onChange={(value) => updateFilter(setStatus, value)} options={[{ value: all, label: "All statuses" }, ...(["available", "rented", "maintenance", "inactive"] as VehicleStatus[]).map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))]} />
        <AdminSelect label="All locations" value={location} onChange={(value) => updateFilter(setLocation, value)} options={[{ value: all, label: "All locations" }, ...locations.map((value) => ({ value: value.id, label: value.name }))]} />
      </FilterBar>
      {mutationError ? <p role="alert" className="border-b border-[var(--admin-border)] px-5 py-3 text-sm font-semibold text-[var(--admin-danger)]">{mutationError}</p> : null}
      <AdminDataTable columns={columns} data={rows} label="Vehicles" emptyState="No vehicles match these filters." pagination={{ page: safePage, pageSize: PAGE_SIZE, total: filtered.length, onPageChange: setPage }} rowActions={(vehicle) => <TableActions><Button onPress={() => router.push(`/admin/vehicles/${vehicle.id}`)} isIconOnly size="sm" variant="ghost" aria-label={`View ${vehicle.name}`}><EyeIcon /></Button><Button onPress={() => router.push(`/admin/vehicles/${vehicle.id}/edit`)} isIconOnly size="sm" variant="ghost" aria-label={`Edit ${vehicle.name}`}><NotePencilIcon /></Button><Button isIconOnly size="sm" variant="ghost" aria-label={`${vehicle.status === "inactive" ? "Reactivate" : "Deactivate"} ${vehicle.name}`} onPress={() => setChanging(vehicle)}><PowerIcon /></Button></TableActions>} />
    </ContentSection>
    <ConfirmationDialog isOpen={Boolean(changing)} onOpenChange={(open) => !open && setChanging(null)} title={changing?.status === "inactive" ? "Reactivate vehicle?" : "Deactivate vehicle?"} description={changing?.status === "inactive" ? `${changing.name} will return to the available catalogue.` : `${changing?.name ?? "This vehicle"} will no longer be available for new bookings.`} confirmLabel={changing?.status === "inactive" ? "Reactivate" : "Deactivate"} danger={changing?.status !== "inactive"} onConfirm={() => void toggleVehicle()} />
  </AdminPage>;
}
