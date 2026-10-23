"use client";

import { Button, Dropdown, Label } from "@heroui/react";
import { DotsThreeVerticalIcon, MapPinIcon, NotePencilIcon, PlusIcon, PowerIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { adminLocations, type AdminLocation } from "@/components/admin/data";
import { AdminSearch } from "@/components/admin/controls";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { ConfirmationDialog } from "@/components/admin/feedback";
import { AdminPage, ContentSection, PageHeader } from "@/components/admin/layout";

const PAGE_SIZE = 10;

export function LocationList() {
  const router = useRouter();
  const [items, setItems] = useState(adminLocations);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [changing, setChanging] = useState<AdminLocation | null>(null);

  const filtered = useMemo(() => items.filter((location) => `${location.name} ${location.city} ${location.address}`.toLowerCase().includes(search.trim().toLowerCase())), [items, search]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const edit = (location: AdminLocation) => router.push(`/admin/locations/${location.id}/edit`);

  function toggle() {
    if (!changing) return;
    setItems((current) => current.map((location) => location.id === changing.id ? { ...location, active: !location.active } : location));
    setChanging(null);
  }

  const columns: ColumnDef<AdminLocation>[] = [
    { accessorKey: "name", header: "Location", cell: ({ row }) => <div className="flex min-w-48 items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-accent-soft)] text-[var(--admin-warning)]"><MapPinIcon size={20} weight="duotone" aria-hidden /></span><p className="truncate font-bold">{row.original.name}</p></div> },
    { accessorKey: "city", header: "City" },
    { accessorKey: "address", header: "Address", cell: ({ row }) => <span className="block max-w-72 truncate">{row.original.address}</span> },
    { id: "coordinates", header: "Coordinates", enableSorting: false, accessorFn: (row) => row.latitude, cell: ({ row }) => row.original.latitude !== null && row.original.longitude !== null ? <span className="whitespace-nowrap text-xs tabular-nums">{row.original.latitude}, {row.original.longitude}</span> : <span className="text-xs text-[var(--admin-muted)]">Not set</span> },
    { id: "status", header: "Status", accessorFn: (row) => (row.active ? "active" : "inactive"), cell: ({ row }) => <AdminStatusBadge status={row.original.active ? "active" : "inactive"} /> },
  ];

  const rowActions = (location: AdminLocation) => (
    <Dropdown>
      <Button isIconOnly size="sm" variant="ghost" aria-label={`Actions for ${location.name}`} className="size-11 min-w-11 md:size-9 md:min-w-9"><DotsThreeVerticalIcon size={20} weight="bold" /></Button>
      <Dropdown.Popover className="adminOverlay">
        <Dropdown.Menu aria-label={`Actions for ${location.name}`}>
          <Dropdown.Item id="edit" textValue="Edit location" onAction={() => edit(location)}><NotePencilIcon size={16} /><Label>Edit</Label></Dropdown.Item>
          <Dropdown.Item id="toggle" textValue={location.active ? "Deactivate" : "Activate"} variant={location.active ? "danger" : "default"} onAction={() => setChanging(location)}><PowerIcon size={16} /><Label>{location.active ? "Deactivate" : "Activate"}</Label></Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );

  return (
    <AdminPage>
      <PageHeader title="Locations" description="Manage Cambodia pickup and return locations." actions={<Button onPress={() => router.push("/admin/locations/new")} variant="primary" className="min-h-11"><PlusIcon />Add Location</Button>} />
      <ContentSection className="overflow-visible">
        <div className="flex items-center gap-3 border-b border-[var(--admin-border)] p-4">
          <AdminSearch value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search locations…" className="max-w-none sm:max-w-sm" />
          <p className="ml-auto hidden text-xs font-semibold text-[var(--admin-muted)] sm:block" aria-live="polite">{filtered.length} location{filtered.length === 1 ? "" : "s"}</p>
        </div>
        <AdminDataTable columns={columns} data={rows} label="Locations" emptyState="No locations found. Try another search or add a RideGo location." pagination={{ page: safePage, pageSize: PAGE_SIZE, total: filtered.length, onPageChange: setPage }} onRowNavigate={edit} rowActions={rowActions} minWidth={760} />
      </ContentSection>
      <ConfirmationDialog isOpen={Boolean(changing)} onOpenChange={(open) => !open && setChanging(null)} title={changing?.active ? "Deactivate location?" : "Activate location?"} description={changing?.active ? `${changing.name} will not be available for new assignments.` : `${changing?.name ?? "This location"} will be available for vehicle assignment.`} confirmLabel={changing?.active ? "Deactivate" : "Activate"} danger={changing?.active} onConfirm={toggle} />
    </AdminPage>
  );
}
