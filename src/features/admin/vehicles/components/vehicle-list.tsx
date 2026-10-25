"use client";

import { Button, Drawer, useOverlayState } from "@heroui/react";
import { ArrowCounterClockwiseIcon, GridFourIcon, ListIcon, PlusIcon, SlidersHorizontalIcon } from "@phosphor-icons/react";
import type { ColumnDef, OnChangeFn, SortingState } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { AdminPagination, AdminSearch, AdminSelect, ViewToggle } from "@/components/admin/controls";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { MoneyDisplay } from "@/components/admin/data-display/misc";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { AdminErrorState, ConfirmationDialog } from "@/components/admin/feedback";
import { AdminPage, ContentSection, PageHeader } from "@/components/admin/layout";
import { toast } from "@/components/ui/toast";
import { useLocationsQuery } from "@/features/admin/locations/hooks/use-locations";
import { ApiError } from "@/lib/api/error";
import { useVehicleListState, VEHICLE_PAGE_SIZE } from "../hooks/use-vehicle-list-state";
import { useVehicleOptions } from "../hooks/use-vehicle-options";
import { useVehicleMutations, useVehiclesQuery } from "../hooks/use-vehicles";
import { capitalize } from "../lib/vehicle-mappers";
import { vehicleStatuses, vehicleTypes, type Vehicle, type VehicleSortBy, type VehicleStatus, type VehicleType } from "../types/vehicle";
import { AdminVehicleCard } from "./admin-vehicle-card";
import { VehicleActions } from "./vehicle-actions";
import { VehiclePhoto } from "@/components/admin/vehicles/vehicle-photo";

type ViewMode = "table" | "cards";


export function VehicleList() {
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
  const [searchText, setSearchText] = useState(params.q ?? "");

  useEffect(() => { const saved = window.localStorage.getItem("ridego-admin-vehicle-view"); if (saved === "table" || saved === "cards") startTransition(() => setView(saved)); }, []);
  // The URL is the source of truth; keep the input in step when it changes from outside (reset, back/forward).
  useEffect(() => { startTransition(() => setSearchText(params.q ?? "")); }, [params.q]);
  useEffect(() => {
    if (searchText.trim() === (params.q ?? "")) return;
    const timer = window.setTimeout(() => state.setFilters({ q: searchText.trim() || undefined }), 300);
    return () => window.clearTimeout(timer);
  }, [searchText]);
  function changeView(next: ViewMode) { setView(next); window.localStorage.setItem("ridego-admin-vehicle-view", next); }

  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;
  const pageCount = Math.max(1, query.data?.meta.totalPages ?? 1);
  const page = Math.min(params.page, pageCount);
  const activeFilters = [params.vehicleType, params.category, params.status, params.locationId].filter(Boolean).length;
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
      toast.success(`${changing.name} ${inactive ? "activated" : "deactivated"}`);
    } catch (error) {
      toast.danger(error instanceof ApiError ? error.message : "The status could not be changed.");
    }
    setChanging(null);
  }
  const open = (vehicle: Vehicle) => router.push(`/admin/vehicles/${vehicle.id}`);
  const edit = (vehicle: Vehicle) => router.push(`/admin/vehicles/${vehicle.id}/edit`);

  const all = "all";
  const withAll = (label: string, items: Array<{ value: string; label: string }>) => [{ value: all, label }, ...items];
  const filterControls = (className?: string) => (
    <>
      <AdminSelect className={className} label="All types" value={params.vehicleType ?? all} onChange={(value) => state.setFilters({ vehicleType: value === all ? undefined : (value as VehicleType) })} options={withAll("All types", vehicleTypes.map((value) => ({ value, label: capitalize(value) })))} />
      <AdminSelect className={className} label="All categories" value={params.category ?? all} onChange={(value) => state.setFilters({ category: value === all ? undefined : value })} options={withAll("All categories", options.filterCategories())} />
      <AdminSelect className={className} label="All statuses" value={params.status ?? all} onChange={(value) => state.setFilters({ status: value === all ? undefined : (value as VehicleStatus) })} options={withAll("All statuses", vehicleStatuses.map((value) => ({ value, label: capitalize(value) })))} />
      <AdminSelect className={className} label="All locations" value={params.locationId ?? all} onChange={(value) => state.setFilters({ locationId: value === all ? undefined : value })} options={withAll("All locations", (locationsQuery.data ?? []).map((value) => ({ value: value.id, label: value.name })))} />
    </>
  );

  const columns: ColumnDef<Vehicle>[] = [
    { accessorKey: "name", header: "Vehicle", cell: ({ row }) => (
      <div className="flex min-w-56 items-center gap-3">
        <VehiclePhoto vehicle={row.original} className="h-12 w-[66px] shrink-0 rounded-xl border border-[var(--admin-border)]" sizes="66px" />
        <div className="min-w-0"><p className="truncate font-bold leading-tight">{row.original.name}</p><p className="mt-0.5 text-xs text-[var(--admin-muted)]">{row.original.registrationNumber}</p></div>
      </div>
    ) },
    { accessorKey: "vehicleType", header: "Type", enableSorting: false, cell: ({ row }) => <span className="capitalize">{row.original.vehicleType}</span> },
    { id: "brand", header: "Brand / model", accessorFn: (row) => `${row.brand} ${row.model}` },
    { id: "location", header: "Location", enableSorting: false, accessorFn: (row) => row.location.name, cell: ({ row }) => <div><p className="font-medium">{row.original.location.name}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.location.city}</p></div> },
    { accessorKey: "dailyRentalPriceMinor", header: "Daily price", cell: ({ row }) => <MoneyDisplay amount={row.original.dailyRentalPriceMinor} /> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <AdminStatusBadge status={row.original.status} /> },
  ];

  const empty = <p className="py-12 text-center text-sm text-[var(--admin-muted)]">{query.isLoading ? "Loading vehicles…" : filtersActive ? "No vehicles match these filters." : "No vehicles yet. Add your first vehicle to get started."}</p>;

  if (query.isError && !query.data) return <AdminPage><PageHeader title="Vehicles" description="Manage your vehicles, pricing, location assignment, and availability." /><AdminErrorState title="Couldn’t load vehicles" description={query.error instanceof ApiError ? query.error.message : "Try again in a moment."} onRetry={() => void query.refetch()} /></AdminPage>;

  return <AdminPage>
    <PageHeader title="Vehicles" description="Manage your vehicles, pricing, location assignment, and availability." actions={<Button onPress={() => router.push("/admin/vehicles/new")} variant="primary" className="min-h-11"><PlusIcon />Add Vehicle</Button>} />
    <ContentSection className="overflow-visible">
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <AdminSearch className="w-auto min-w-0 max-w-none flex-1 basis-0 sm:max-w-xl" value={searchText} onChange={setSearchText} placeholder="Search vehicles…" />
          <Button variant="outline" className="relative min-h-11 shrink-0 lg:hidden" onPress={filterDrawer.open} aria-label={`Filters${activeFilters ? `, ${activeFilters} active` : ""}`}>
            <SlidersHorizontalIcon size={18} /><span className="max-sm:sr-only">Filters</span>
            {activeFilters ? <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--admin-accent)] text-[11px] font-extrabold text-[#111820]">{activeFilters}</span> : null}
          </Button>
          <div className="ml-auto"><ViewToggle value={view} onChange={changeView} options={[{ value: "table", label: "Table", icon: <ListIcon size={17} /> }, { value: "cards", label: "Cards", icon: <GridFourIcon size={17} /> }]} /></div>
        </div>
        <div className="hidden flex-wrap items-center gap-2 lg:flex">
          {filterControls()}
          {filtersActive ? <Button size="sm" variant="ghost" className="min-h-10" onPress={resetFilters}><ArrowCounterClockwiseIcon size={15} />Reset filters</Button> : null}
          <p className="ml-auto text-xs font-semibold text-[var(--admin-muted)]" aria-live="polite">{total} vehicle{total === 1 ? "" : "s"}</p>
        </div>
      </div>

      {view === "table" ? (
        <>
          <div className="hidden md:block">
            <AdminDataTable columns={columns} data={rows} label="Vehicles" emptyState={filtersActive ? "No vehicles match these filters." : "No vehicles yet. Add your first vehicle to get started."} pagination={{ page, pageSize: VEHICLE_PAGE_SIZE, total, onPageChange: setPage }} showPagination={false} manualSorting sorting={sorting} onSortingChange={changeSorting} loading={query.isLoading} onRowNavigate={open} rowActions={(vehicle) => <VehicleActions vehicle={vehicle} onView={() => open(vehicle)} onEdit={() => edit(vehicle)} onToggle={() => setChanging(vehicle)} />} />
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
      <Drawer.Content placement="right" className="w-full max-w-md">
        <Drawer.Dialog aria-label="Filter vehicles">
          <Drawer.CloseTrigger />
          <Drawer.Header><Drawer.Heading>Filter vehicles</Drawer.Heading></Drawer.Header>
          <Drawer.Body className="grid gap-3">{filterControls("w-full")}</Drawer.Body>
          <Drawer.Footer className="grid grid-cols-2 gap-2">
            <Button variant="tertiary" className="min-h-11" isDisabled={!filtersActive} onPress={resetFilters}>Reset</Button>
            <Button variant="primary" className="min-h-11" onPress={filterDrawer.close}>Show {total} vehicle{total === 1 ? "" : "s"}</Button>
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>

    <ConfirmationDialog isOpen={Boolean(changing)} onOpenChange={(isOpen) => !isOpen && setChanging(null)} title={changing?.status === "inactive" ? "Activate vehicle?" : "Deactivate vehicle?"} description={changing?.status === "inactive" ? `${changing.name} will return to the available catalogue.` : `${changing?.name ?? "This vehicle"} will no longer be available for new bookings.`} confirmLabel={changing?.status === "inactive" ? "Activate" : "Deactivate"} danger={changing?.status !== "inactive"} isPending={mutations.setStatus.isPending} onConfirm={() => void toggleVehicle()} />
  </AdminPage>;
}
