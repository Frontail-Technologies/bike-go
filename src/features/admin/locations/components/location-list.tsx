"use client";

import { Button, Dropdown, Label } from "@heroui/react";
import { DotsThreeVerticalIcon, LinkIcon, MapPinIcon, NotePencilIcon, PlusIcon, PowerIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useDeferredValue, useState } from "react";
import { AdminSearch } from "@/components/admin/controls";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { AdminErrorState, ConfirmationDialog } from "@/components/admin/feedback";
import { AdminPage, ContentSection, PageHeader } from "@/components/admin/layout";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/error";
import { useLocationMutations, useLocationsPageQuery } from "../hooks/use-locations";
import type { Location } from "../types/location";
import { MapLinkDialog } from "./map-link-dialog";

const PAGE_SIZE = 10;

export function LocationList() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search.trim());
  const query = useLocationsPageQuery({ page, pageSize: PAGE_SIZE, q: deferredSearch || undefined });
  const mutations = useLocationMutations();
  const [changing, setChanging] = useState<Location | null>(null);
  const [linking, setLinking] = useState<Location | null>(null);

  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;
  const edit = (location: Location) => router.push(`/admin/locations/${location.id}/edit`);

  async function toggle() {
    if (!changing) return;
    try {
      await mutations.update.mutateAsync({ id: changing.id, active: !changing.active });
      toast.success(`${changing.name} ${changing.active ? "deactivated" : "activated"}`);
    } catch (error) {
      toast.danger(error instanceof ApiError ? error.message : "The location could not be updated.");
    }
    setChanging(null);
  }

  async function saveCoordinates(coordinates: { latitude: number; longitude: number }) {
    if (!linking) return;
    try {
      await mutations.update.mutateAsync({ id: linking.id, ...coordinates });
      toast.success("Coordinates saved");
    } catch (error) {
      toast.danger(error instanceof ApiError ? error.message : "The coordinates could not be saved.");
    }
  }

  const columns: ColumnDef<Location>[] = [
    { accessorKey: "name", header: "Location", cell: ({ row }) => <div className="flex min-w-48 items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-accent-soft)] text-[var(--admin-warning)]"><MapPinIcon size={20} weight="duotone" aria-hidden /></span><p className="truncate font-bold">{row.original.name}</p></div> },
    { accessorKey: "city", header: "City" },
    { accessorKey: "address", header: "Address", cell: ({ row }) => <span className="block max-w-72 truncate">{row.original.address}</span> },
    { id: "coordinates", header: "Coordinates", enableSorting: false, accessorFn: (row) => row.latitude, cell: ({ row }) => row.original.latitude !== null && row.original.longitude !== null ? <span className="whitespace-nowrap text-xs tabular-nums">{row.original.latitude}, {row.original.longitude}</span> : <Button size="sm" variant="outline" className="min-h-11 md:min-h-8" aria-label={`Add coordinates for ${row.original.name} by link`} onPress={() => setLinking(row.original)}><LinkIcon size={14} />Add by link</Button> },
    { id: "status", header: "Status", accessorFn: (row) => (row.active ? "active" : "inactive"), cell: ({ row }) => <AdminStatusBadge status={row.original.active ? "active" : "inactive"} /> },
  ];

  const rowActions = (location: Location) => (
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

  if (query.isError && !query.data) return <AdminPage><PageHeader title="Locations" description="Manage Cambodia pickup and return locations." /><AdminErrorState title="Couldn’t load locations" description={query.error instanceof ApiError ? query.error.message : "Try again in a moment."} onRetry={() => void query.refetch()} /></AdminPage>;

  return (
    <AdminPage>
      <PageHeader title="Locations" description="Manage Cambodia pickup and return locations." actions={<Button onPress={() => router.push("/admin/locations/new")} variant="primary" className="min-h-11"><PlusIcon />Add Location</Button>} />
      <ContentSection className="overflow-visible">
        <div className="flex items-center gap-3 p-4">
          <AdminSearch value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search locations…" className="max-w-none sm:max-w-sm" />
          <p className="ml-auto hidden text-xs font-semibold text-[var(--admin-muted)] sm:block" aria-live="polite">{total} location{total === 1 ? "" : "s"}</p>
        </div>
        <AdminDataTable columns={columns} data={rows} label="Locations" emptyState={query.isLoading ? "Loading locations…" : "No locations found. Try another search or add a RideGo location."} loading={query.isLoading} pagination={{ page, pageSize: PAGE_SIZE, total, onPageChange: setPage }} onRowNavigate={edit} rowActions={rowActions} minWidth={760} />
      </ContentSection>
      <MapLinkDialog name={linking?.name ?? null} isOpen={Boolean(linking)} onOpenChange={(open) => !open && setLinking(null)} onSave={(coordinates) => void saveCoordinates(coordinates)} />
      <ConfirmationDialog isOpen={Boolean(changing)} onOpenChange={(open) => !open && setChanging(null)} title={changing?.active ? "Deactivate location?" : "Activate location?"} description={changing?.active ? `${changing.name} will not be available for new assignments.` : `${changing?.name ?? "This location"} will be available for vehicle assignment.`} confirmLabel={changing?.active ? "Deactivate" : "Activate"} danger={changing?.active} isPending={mutations.update.isPending} onConfirm={() => void toggle()} />
    </AdminPage>
  );
}
