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
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

const PAGE_SIZE = 10;

export function LocationList() {
  const t = useAdminTranslations();
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
      toast.success(t(changing.active ? "locations.deactivated" : "locations.activated", { name: changing.name }));
    } catch (error) {
      toast.danger(error instanceof ApiError ? error.message : t("locations.updateError"));
    }
    setChanging(null);
  }

  async function saveCoordinates(coordinates: { latitude: number; longitude: number }) {
    if (!linking) return;
    try {
      await mutations.update.mutateAsync({ id: linking.id, ...coordinates });
      toast.success(t("locations.coordinatesSaved"));
    } catch (error) {
      toast.danger(error instanceof ApiError ? error.message : t("locations.coordinatesError"));
    }
  }

  const columns: ColumnDef<Location>[] = [
    { accessorKey: "name", header: t("locations.columns.location"), cell: ({ row }) => <div className="flex min-w-48 items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-accent-soft)] text-[var(--admin-warning)]"><MapPinIcon size={20} weight="duotone" aria-hidden /></span><p className="truncate font-bold">{row.original.name}</p></div> },
    { accessorKey: "city", header: t("locations.columns.city") },
    { accessorKey: "address", header: t("locations.columns.address"), cell: ({ row }) => <span className="block max-w-72 truncate">{row.original.address}</span> },
    { id: "coordinates", header: t("locations.columns.coordinates"), enableSorting: false, accessorFn: (row) => row.latitude, cell: ({ row }) => row.original.latitude !== null && row.original.longitude !== null ? <span className="whitespace-nowrap text-xs tabular-nums">{row.original.latitude}, {row.original.longitude}</span> : <Button size="sm" variant="outline" className="min-h-11 md:min-h-8" aria-label={t("locations.addByLinkAria", { name: row.original.name })} onPress={() => setLinking(row.original)}><LinkIcon size={14} />{t("locations.addByLink")}</Button> },
    { id: "status", header: t("locations.columns.status"), accessorFn: (row) => (row.active ? "active" : "inactive"), cell: ({ row }) => <AdminStatusBadge status={row.original.active ? "active" : "inactive"} /> },
  ];

  const rowActions = (location: Location) => (
    <Dropdown>
      <Button isIconOnly size="sm" variant="ghost" aria-label={t("locations.actionsFor", { name: location.name })} className="size-11 min-w-11 md:size-9 md:min-w-9"><DotsThreeVerticalIcon size={20} weight="bold" /></Button>
      <Dropdown.Popover className="adminOverlay">
        <Dropdown.Menu aria-label={t("locations.actionsFor", { name: location.name })}>
          <Dropdown.Item id="edit" textValue={t("locations.editLocation")} onAction={() => edit(location)}><NotePencilIcon size={16} /><Label>{t("locations.edit")}</Label></Dropdown.Item>
          <Dropdown.Item id="toggle" textValue={location.active ? t("actions.deactivate") : t("actions.activate")} variant={location.active ? "danger" : "default"} onAction={() => setChanging(location)}><PowerIcon size={16} /><Label>{location.active ? t("actions.deactivate") : t("actions.activate")}</Label></Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );

  if (query.isError && !query.data) return <AdminPage><PageHeader title={t("pages.locations.title")} description={t("pages.locations.description")} /><AdminErrorState title={t("locations.listLoadError")} description={query.error instanceof ApiError ? query.error.message : t("common.retryLater")} onRetry={() => void query.refetch()} /></AdminPage>;

  return (
    <AdminPage>
      <PageHeader title={t("pages.locations.title")} description={t("pages.locations.description")} actions={<Button onPress={() => router.push("/admin/locations/new")} variant="primary" className="min-h-11"><PlusIcon />{t("pages.locations.add")}</Button>} />
      <ContentSection className="overflow-visible">
        <div className="flex items-center gap-3 p-4">
          <AdminSearch value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder={t("pages.locations.search")} className="max-w-none sm:max-w-sm" />
          <p className="ml-auto hidden text-xs font-semibold text-[var(--admin-muted)] sm:block" aria-live="polite">{t(total === 1 ? "locations.countOne" : "locations.count", { count: total })}</p>
        </div>
        <AdminDataTable columns={columns} data={rows} label={t("pages.locations.title")} emptyState={query.isLoading ? t("locations.loading") : t("locations.empty")} loading={query.isLoading} pagination={{ page, pageSize: PAGE_SIZE, total, onPageChange: setPage }} onRowNavigate={edit} rowActions={rowActions} minWidth={760} />
      </ContentSection>
      <MapLinkDialog name={linking?.name ?? null} isOpen={Boolean(linking)} onOpenChange={(open) => !open && setLinking(null)} onSave={(coordinates) => void saveCoordinates(coordinates)} />
      <ConfirmationDialog isOpen={Boolean(changing)} onOpenChange={(open) => !open && setChanging(null)} title={changing?.active ? t("locations.deactivateTitle") : t("locations.activateTitle")} description={changing?.active ? t("locations.deactivateDescription", { name: changing.name }) : t("locations.activateDescription", { name: changing?.name ?? t("locations.thisLocation") })} confirmLabel={changing?.active ? t("actions.deactivate") : t("actions.activate")} danger={changing?.active} isPending={mutations.update.isPending} onConfirm={() => void toggle()} />
    </AdminPage>
  );
}
