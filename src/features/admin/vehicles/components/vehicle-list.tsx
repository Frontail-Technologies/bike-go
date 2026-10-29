"use client";

import { Drawer, useOverlayState } from "@heroui/react";
import { ArrowCounterClockwiseIcon, GridFourIcon, ListIcon, PlusIcon, SlidersHorizontalIcon } from "@phosphor-icons/react";
import type { ColumnDef, OnChangeFn, SortingState } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { AdminButton as Button, AdminPagination, AdminSearch, AdminSelect, ViewToggle } from "@/components/admin/controls";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { MoneyDisplay } from "@/components/admin/data-display/misc";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { AdminErrorState, ConfirmationDialog } from "@/components/admin/feedback";
import { AdminPage, ContentSection, PageHeader } from "@/components/admin/layout";
import { toast } from "@/components/ui/toast";
import { useLocationsQuery } from "@/features/admin/locations/hooks/use-locations";
import { ApiError } from "@/lib/api/error";
import { activeFilterCount, pageCount as getPageCount } from "@/hooks/use-list-state";
import { useVehicleListState, VEHICLE_PAGE_SIZE } from "../hooks/use-vehicle-list-state";
import { useVehicleOptions } from "../hooks/use-vehicle-options";
import { useVehicleMutations, useVehiclesQuery } from "../hooks/use-vehicles";
import { vehicleStatuses, vehicleTypes, type Vehicle, type VehicleSortBy, type VehicleStatus, type VehicleType } from "../types/vehicle";
import { AdminVehicleCard } from "./admin-vehicle-card";
import { VehicleActions } from "./vehicle-actions";
import { VehiclePhoto } from "@/components/admin/vehicles/vehicle-photo";
import { useUrlSearchInput } from "@/hooks/use-url-search-input";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

type ViewMode = "table" | "cards";


export function VehicleList() {
  const t = useAdminTranslations();
  const router = useRouter();
  const filterDrawer = useOverlayState();
  const state = useVehicleListState();
  const { params } = state;
  const query = useVehiclesQuery(params);
  const mutations = useVehicleMutations();
  const options = useVehicleOptions();
  const locationsQuery = useLocationsQuery();
  const [view, setView] = useState<ViewMode>("table");
  const [changing, setChanging] = useState<Vehicle | null>(null);
  const [searchText, setSearchText] = useUrlSearchInput(params.q, (q) => state.setFilters({ q }));

  useEffect(() => { const saved = window.localStorage.getItem("ridego-admin-vehicle-view"); if (saved === "table" || saved === "cards") startTransition(() => setView(saved)); }, []);
  function changeView(next: ViewMode) { setView(next); window.localStorage.setItem("ridego-admin-vehicle-view", next); }

  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;
  const pageCount = getPageCount(query.data?.meta);
  const page = Math.min(params.page, pageCount);
  const activeFilters = activeFilterCount(params, ["page", "pageSize", "sortBy", "sortOrder", "q"]);
  const filtersActive = Boolean(params.q || activeFilters);
  const setPage = state.setPage;
  const resetFilters = () => { setSearchText(""); state.reset(); };
  const sorting: SortingState = params.sortBy ? [{ id: params.sortBy, desc: params.sortOrder === "desc" }] : [];
  const changeSorting: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    state.setFilters(next[0] ? { sortBy: next[0].id as VehicleSortBy, sortOrder: next[0].desc ? "desc" : "asc" } : { sortBy: undefined, sortOrder: undefined });
  };
  async function toggleVehicle() {
    if (!changing) return;
    const inactive = changing.status === "inactive";
    try {
      await mutations.setStatus.mutateAsync({ id: changing.id, status: inactive ? "available" : "inactive" });
      toast.success(t(inactive ? "vehicles.activated" : "vehicles.deactivated", { name: changing.name }));
    } catch (error) {
      toast.danger(error instanceof ApiError ? error.message : t("vehicles.statusError"));
    }
    setChanging(null);
  }
  const open = (vehicle: Vehicle) => router.push(`/admin/vehicles/${vehicle.id}`);
  const edit = (vehicle: Vehicle) => router.push(`/admin/vehicles/${vehicle.id}/edit`);

  const all = "all";
  const withAll = (label: string, items: Array<{ value: string; label: string }>) => [{ value: all, label }, ...items];
  const filterControls = (className?: string) => (
    <>
      <AdminSelect className={className} label={t("filters.allTypes")} value={params.vehicleType ?? all} onChange={(value) => state.setFilters({ vehicleType: value === all ? undefined : (value as VehicleType) })} options={withAll(t("filters.allTypes"), vehicleTypes.map((value) => ({ value, label: t(`vehicles.types.${value}`) })))} />
      <AdminSelect className={className} label={t("vehicles.allCategories")} value={params.category ?? all} onChange={(value) => state.setFilters({ category: value === all ? undefined : value })} options={withAll(t("vehicles.allCategories"), options.filterCategories())} />
      <AdminSelect className={className} label={t("filters.allStatuses")} value={params.status ?? all} onChange={(value) => state.setFilters({ status: value === all ? undefined : (value as VehicleStatus) })} options={withAll(t("filters.allStatuses"), vehicleStatuses.map((value) => ({ value, label: t(`status.${value}`) })))} />
      <AdminSelect className={className} label={t("filters.allLocations")} value={params.locationId ?? all} onChange={(value) => state.setFilters({ locationId: value === all ? undefined : value })} options={withAll(t("filters.allLocations"), (locationsQuery.data ?? []).map((value) => ({ value: value.id, label: value.name })))} />
    </>
  );

  const columns: ColumnDef<Vehicle>[] = [
    { accessorKey: "name", header: t("vehicles.columns.vehicle"), cell: ({ row }) => (
      <div className="flex min-w-56 items-center gap-3">
        <VehiclePhoto vehicle={row.original} className="h-12 w-[66px] shrink-0 rounded-xl border border-[var(--admin-border)]" sizes="66px" />
        <div className="min-w-0"><p className="truncate font-bold leading-tight">{row.original.name}</p><p className="mt-0.5 text-xs text-[var(--admin-muted)]">{row.original.registrationNumber}</p></div>
      </div>
    ) },
    { accessorKey: "vehicleType", header: t("vehicles.columns.type"), enableSorting: false, cell: ({ row }) => <span>{t(`vehicles.types.${row.original.vehicleType}`)}</span> },
    { id: "brand", header: t("vehicles.columns.brandModel"), accessorFn: (row) => `${row.brand} ${row.model}` },
    { id: "location", header: t("vehicles.columns.location"), enableSorting: false, accessorFn: (row) => row.location.name, cell: ({ row }) => <div><p className="font-medium">{row.original.location.name}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.location.city}</p></div> },
    { accessorKey: "dailyRentalPriceMinor", header: t("vehicles.columns.dailyPrice"), cell: ({ row }) => <MoneyDisplay amount={row.original.dailyRentalPriceMinor} /> },
    { accessorKey: "status", header: t("vehicles.columns.status"), cell: ({ row }) => <AdminStatusBadge status={row.original.status} /> },
  ];

  const empty = <p className="py-12 text-center text-sm text-[var(--admin-muted)]">{query.isLoading ? t("vehicles.loading") : filtersActive ? t("vehicles.noMatches") : t("vehicles.empty")}</p>;

  if (query.isError && !query.data) return <AdminPage><PageHeader title={t("pages.vehicles.title")} description={t("pages.vehicles.description")} /><AdminErrorState description={query.error instanceof ApiError ? query.error.message : undefined} onRetry={() => void query.refetch()} /></AdminPage>;

  return <AdminPage>
    <PageHeader title={t("pages.vehicles.title")} description={t("pages.vehicles.description")} actions={<Button onPress={() => router.push("/admin/vehicles/new")} variant="primary" className="min-h-11"><PlusIcon />{t("pages.vehicles.add")}</Button>} />
    <ContentSection className="overflow-visible">
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <AdminSearch className="w-auto min-w-0 max-w-none flex-1 basis-0 sm:max-w-xl" value={searchText} onChange={setSearchText} placeholder={t("pages.vehicles.search")} />
          <Button variant="outline" className="relative min-h-11 shrink-0 lg:hidden" onPress={filterDrawer.open} aria-label={activeFilters ? t("filters.activeCount", { count: activeFilters }) : t("filters.filters")}>
            <SlidersHorizontalIcon size={18} /><span className="max-sm:sr-only">{t("filters.filters")}</span>
            {activeFilters ? <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--admin-accent)] text-[11px] font-extrabold text-[#111820]">{activeFilters}</span> : null}
          </Button>
          <div className="ml-auto"><ViewToggle value={view} onChange={changeView} options={[{ value: "table", label: t("ui.table"), icon: <ListIcon size={17} /> }, { value: "cards", label: t("ui.cards"), icon: <GridFourIcon size={17} /> }]} /></div>
        </div>
        <div className="hidden flex-wrap items-center gap-2 lg:flex">
          {filterControls()}
          {filtersActive ? <Button size="sm" variant="ghost" className="min-h-10" onPress={resetFilters}><ArrowCounterClockwiseIcon size={15} />{t("filters.resetFilters")}</Button> : null}
          <p className="ml-auto text-xs font-semibold text-[var(--admin-muted)]" aria-live="polite">{t(total === 1 ? "vehicles.countOne" : "vehicles.count", { count: total })}</p>
        </div>
      </div>

      {view === "table" ? (
        <>
          <div className="hidden md:block">
            <AdminDataTable columns={columns} data={rows} label={t("pages.vehicles.title")} emptyState={filtersActive ? t("vehicles.noMatches") : t("vehicles.empty")} pagination={{ page, pageSize: VEHICLE_PAGE_SIZE, total, onPageChange: setPage }} showPagination={false} manualSorting sorting={sorting} onSortingChange={changeSorting} loading={query.isLoading} onRowNavigate={open} rowActions={(vehicle) => <VehicleActions vehicle={vehicle} onView={() => open(vehicle)} onEdit={() => edit(vehicle)} onToggle={() => setChanging(vehicle)} />} />
          </div>
          <ul className="divide-y divide-[var(--admin-border)] md:hidden" aria-label={t("pages.vehicles.title")}>
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
          <div className="border-t border-[var(--admin-border)]"><AdminPagination page={page} pageCount={pageCount} total={total} pageSize={VEHICLE_PAGE_SIZE} onPageChange={setPage} /></div>
        </>
      ) : (
        <>
          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3 2xl:grid-cols-4">
            {rows.map((vehicle) => <AdminVehicleCard key={vehicle.id} vehicle={vehicle} onView={() => open(vehicle)} onEdit={() => edit(vehicle)} onToggle={() => setChanging(vehicle)} />)}
            {!rows.length ? <div className="col-span-full">{empty}</div> : null}
          </div>
          {total > VEHICLE_PAGE_SIZE ? <div className="border-t border-[var(--admin-border)]"><AdminPagination page={page} pageCount={pageCount} total={total} pageSize={VEHICLE_PAGE_SIZE} onPageChange={setPage} /></div> : null}
        </>
      )}
    </ContentSection>

    <Drawer.Backdrop isOpen={filterDrawer.isOpen} onOpenChange={filterDrawer.setOpen} className="adminOverlay">
      <Drawer.Content placement="bottom">
        <Drawer.Dialog aria-label={t("vehicles.filterTitle")}>
          <Drawer.Handle />
          <Drawer.Header><Drawer.Heading>{t("vehicles.filterTitle")}</Drawer.Heading></Drawer.Header>
          <Drawer.Body className="grid gap-3 overflow-y-auto">{filterControls("w-full")}</Drawer.Body>
          <Drawer.Footer className="grid grid-cols-2 gap-2">
            <Button variant="tertiary" className="min-h-11" isDisabled={!filtersActive} onPress={resetFilters}>{t("filters.reset")}</Button>
            <Button variant="primary" className="min-h-11" onPress={filterDrawer.close}>{t(total === 1 ? "vehicles.showOne" : "vehicles.show", { count: total })}</Button>
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>

    <ConfirmationDialog isOpen={Boolean(changing)} onOpenChange={(isOpen) => !isOpen && setChanging(null)} title={changing?.status === "inactive" ? t("vehicles.activateTitle") : t("vehicles.deactivateTitle")} description={changing?.status === "inactive" ? t("vehicles.returnsToCatalogue", { name: changing.name }) : t("vehicles.noLongerAvailable", { name: changing?.name ?? t("vehicles.thisVehicle") })} confirmLabel={changing?.status === "inactive" ? t("actions.activate") : t("actions.deactivate")} danger={changing?.status !== "inactive"} isPending={mutations.setStatus.isPending} onConfirm={() => void toggleVehicle()} />
  </AdminPage>;
}
