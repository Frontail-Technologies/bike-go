"use client";

import { Button, Drawer, useOverlayState } from "@heroui/react";
import { ArrowCounterClockwiseIcon, GridFourIcon, ListIcon, PlusIcon, SlidersHorizontalIcon } from "@phosphor-icons/react";
import type { ColumnDef, OnChangeFn, SortingState } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { AdminPagination, AdminSearch, AdminSelect, ViewToggle } from "@/components/admin/controls";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { AdminErrorState, ConfirmationDialog } from "@/components/admin/feedback";
import { AdminPage, ContentSection, PageHeader } from "@/components/admin/layout";
import { AdminTabs } from "@/components/admin/navigation";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/error";
import { BANNER_PAGE_SIZE, useBannerListState } from "../hooks/use-banner-list-state";
import { useBannerMutations, useBannersQuery } from "../hooks/use-banners";
import { formatSchedule, placementMeta } from "../lib/banner-model";
import { bannerStatuses, placements, type Banner, type BannerPlacement, type BannerSort, type BannerStatus } from "../types/banner";
import { AdminBannerCard } from "./admin-banner-card";
import { BannerImage } from "./banner-image";
import { BannerOrder } from "./banner-order";
import { BannerActions, type BannerHandlers, PlacementBadge } from "./banner-parts";
import { BannerPreview } from "./banner-preview";

const all = "all";
type ViewMode = "table" | "cards";
const statusLabels: Record<BannerStatus, string> = { active: "Active", scheduled: "Scheduled", inactive: "Inactive", expired: "Expired" };
const failure = (error: unknown) => (error instanceof ApiError ? error.message : "Something went wrong. Try again.");

/** The backend sorts ascending by these columns; a second press clears the sort. */
const sortColumns: Record<string, BannerSort> = { title: "title", displayOrder: "displayOrder", schedule: "startAt" };
const sortingFor = (sort: BannerSort | undefined): SortingState => {
  const found = Object.entries(sortColumns).find(([, key]) => key === sort);
  return found ? [{ id: found[0], desc: false }] : [];
};

export function BannerWorkspace() {
  const router = useRouter();
  const filterDrawer = useOverlayState();
  const preview = useOverlayState();
  const state = useBannerListState();
  const { params } = state;
  const query = useBannersQuery(params);
  const mutations = useBannerMutations();
  const [view, setView] = useState<ViewMode>("table");
  const [tab, setTab] = useState("banners");
  const [searchText, setSearchText] = useState(params.q ?? "");
  const [previewing, setPreviewing] = useState<Banner | null>(null);
  const [deactivating, setDeactivating] = useState<Banner | null>(null);
  const [deleting, setDeleting] = useState<Banner | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("ridego-admin-banner-view");
    const next: ViewMode = saved === "table" || saved === "cards" ? saved : window.innerWidth < 768 ? "cards" : "table";
    startTransition(() => setView(next));
  }, []);
  // The URL is the source of truth; keep the input in step when it changes from outside (reset, back/forward).
  useEffect(() => { startTransition(() => setSearchText(params.q ?? "")); }, [params.q]);
  useEffect(() => {
    if (searchText.trim() === (params.q ?? "")) return;
    const timer = window.setTimeout(() => state.setFilters({ q: searchText.trim() || undefined }), 300);
    return () => window.clearTimeout(timer);
  }, [searchText]);
  function changeView(next: ViewMode) { setView(next); window.localStorage.setItem("ridego-admin-banner-view", next); }

  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;
  const pageCount = Math.max(1, query.data?.meta.totalPages ?? 1);
  const page = Math.min(params.page, pageCount);
  const activeFilters = [params.placement, params.status].filter(Boolean).length;
  const filtersActive = Boolean(params.q || activeFilters);
  const reset = () => { setSearchText(""); state.reset(); };
  const sorting = sortingFor(params.sort);
  const changeSorting: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    const wanted = next[0] && !next[0].desc ? sortColumns[next[0].id] : undefined;
    state.setFilters({ sort: wanted });
  };

  async function setActive(banner: Banner, status: "active" | "inactive") {
    try {
      await mutations.setStatus.mutateAsync({ id: banner.id, status });
      toast.success(`${banner.title} ${status === "active" ? "activated" : "deactivated"}`);
    } catch (error) {
      toast.danger(failure(error));
    }
    setDeactivating(null);
  }
  async function remove(banner: Banner) {
    try {
      await mutations.remove.mutateAsync(banner.id);
      toast.success(`${banner.title} deleted`);
    } catch (error) {
      toast.danger(failure(error));
    }
    setDeleting(null);
  }
  async function duplicate(banner: Banner) {
    try {
      const copy = await mutations.duplicate.mutateAsync(banner);
      toast.success(`${copy.title} created`, { description: "The copy is inactive until you activate it." });
    } catch (error) {
      toast.danger(failure(error));
    }
  }

  const handlers: BannerHandlers = {
    onEdit: (banner) => router.push(`/admin/banners/${banner.id}/edit`),
    onPreview: (banner) => { setPreviewing(banner); preview.open(); },
    onToggle: (banner) => (banner.status === "inactive" ? void setActive(banner, "active") : setDeactivating(banner)),
    onDuplicate: (banner) => void duplicate(banner),
    onDelete: setDeleting,
  };

  const columns: ColumnDef<Banner>[] = [
    { id: "title", header: "Banner", accessorFn: (row) => row.title, cell: ({ row }) => (
      <div className="flex min-w-60 items-center gap-3">
        <BannerImage banner={row.original} className="h-12 w-[84px] shrink-0 rounded-lg border border-[var(--admin-border)]" sizes="84px" />
        <div className="min-w-0"><p className="truncate font-bold leading-tight">{row.original.title}</p><p className="truncate text-xs text-[var(--admin-muted)]">{row.original.subtitle ?? ""}</p></div>
      </div>
    ) },
    { id: "placement", header: "Placement", enableSorting: false, accessorFn: (row) => row.placement, cell: ({ row }) => <PlacementBadge placement={row.original.placement} /> },
    { id: "status", header: "Status", enableSorting: false, accessorFn: (row) => row.effectiveStatus, cell: ({ row }) => <AdminStatusBadge status={row.original.effectiveStatus} /> },
    { id: "displayOrder", header: "Display order", accessorFn: (row) => row.displayOrder, cell: ({ row }) => <span className="font-semibold tabular-nums">{row.original.displayOrder}</span> },
    { id: "schedule", header: "Schedule", accessorFn: (row) => row.startAt ?? "", cell: ({ row }) => <span className="whitespace-nowrap text-xs">{formatSchedule(row.original)}</span> },
  ];

  const filterControls = (className?: string) => (
    <>
      <AdminSelect className={className} label="All placements" value={params.placement ?? all} onChange={(value) => state.setFilters({ placement: value === all ? undefined : (value as BannerPlacement) })} options={[{ value: all, label: "All placements" }, ...placements.map((value) => ({ value, label: placementMeta[value].label }))]} />
      <AdminSelect className={className} label="All statuses" value={params.status ?? all} onChange={(value) => state.setFilters({ status: value === all ? undefined : (value as BannerStatus) })} options={[{ value: all, label: "All statuses" }, ...bannerStatuses.map((value) => ({ value, label: statusLabels[value] }))]} />
    </>
  );

  const emptyText = query.isLoading ? "Loading banners…" : filtersActive ? "No banners match these filters." : "No banners yet. Add one to get started.";
  const empty = <p className="py-12 text-center text-sm text-[var(--admin-muted)]">{emptyText}</p>;

  const list = query.isError && !query.data ? (
    <AdminErrorState title="Couldn’t load banners" description={failure(query.error)} onRetry={() => void query.refetch()} />
  ) : (
    <ContentSection className="overflow-visible">
      <div className="space-y-3 border-b border-[var(--admin-border)] p-4">
        <div className="flex items-center gap-2">
          <AdminSearch className="w-auto min-w-0 max-w-none flex-1 basis-0 sm:max-w-md" value={searchText} onChange={setSearchText} placeholder="Search banners…" />
          <Button variant="outline" className="relative min-h-11 shrink-0 lg:hidden" onPress={filterDrawer.open} aria-label={`Filters${activeFilters ? `, ${activeFilters} active` : ""}`}>
            <SlidersHorizontalIcon size={18} /><span className="max-sm:sr-only">Filters</span>
            {activeFilters ? <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--admin-accent)] text-[11px] font-extrabold text-[#111820]">{activeFilters}</span> : null}
          </Button>
          <div className="hidden items-center gap-2 lg:flex">{filterControls()}{filtersActive ? <Button size="sm" variant="ghost" className="min-h-10" onPress={reset}><ArrowCounterClockwiseIcon size={15} />Reset filters</Button> : null}</div>
          <div className="ml-auto"><ViewToggle label="Banner view" value={view} onChange={changeView} options={[{ value: "table", label: "Table", icon: <ListIcon size={17} /> }, { value: "cards", label: "Cards", icon: <GridFourIcon size={17} /> }]} /></div>
        </div>
        {filtersActive ? <p className="text-xs font-semibold text-[var(--admin-muted)] lg:hidden" aria-live="polite">{total} banner{total === 1 ? "" : "s"} <button type="button" className="ml-2 font-bold text-[var(--admin-info)] underline" onClick={reset}>Reset filters</button></p> : null}
      </div>
      {view === "table" ? (
        <AdminDataTable columns={columns} data={rows} label="Banners" emptyState={emptyText} pagination={{ page, pageSize: BANNER_PAGE_SIZE, total, onPageChange: state.setPage }} manualSorting sorting={sorting} onSortingChange={changeSorting} loading={query.isLoading} onRowNavigate={handlers.onEdit} rowActions={(banner) => <BannerActions banner={banner} handlers={handlers} />} minWidth={820} />
      ) : (
        <>
          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
            {rows.map((banner) => <AdminBannerCard key={banner.id} banner={banner} handlers={handlers} />)}
            {!rows.length ? <div className="col-span-full">{empty}</div> : null}
          </div>
          <div className="border-t border-[var(--admin-border)]"><AdminPagination page={page} pageCount={pageCount} total={total} pageSize={BANNER_PAGE_SIZE} onPageChange={state.setPage} /></div>
        </>
      )}
    </ContentSection>
  );

  return (
    <AdminPage>
      <PageHeader title="Banners" description="Manage promotional banners across different placements and schedules." actions={<Button variant="primary" className="min-h-11" onPress={() => router.push("/admin/banners/new")}><PlusIcon />Add Banner</Button>} />
      <AdminTabs label="Banner views" selectedKey={tab} onSelectionChange={setTab} items={[
        { id: "banners", label: "All Banners", content: list },
        { id: "order", label: "Order & Placement", content: <BannerOrder handlers={handlers} /> },
      ]} />

      <Drawer.Backdrop isOpen={filterDrawer.isOpen} onOpenChange={filterDrawer.setOpen} className="adminOverlay">
        <Drawer.Content placement="right" className="w-full max-w-md">
          <Drawer.Dialog aria-label="Filter banners">
            <Drawer.CloseTrigger />
            <Drawer.Header><Drawer.Heading>Filter banners</Drawer.Heading></Drawer.Header>
            <Drawer.Body className="grid gap-3">{filterControls("w-full")}</Drawer.Body>
            <Drawer.Footer className="grid grid-cols-2 gap-2">
              <Button variant="tertiary" className="min-h-11" isDisabled={!filtersActive} onPress={reset}>Reset</Button>
              <Button variant="primary" className="min-h-11" onPress={filterDrawer.close}>Show {total} banner{total === 1 ? "" : "s"}</Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>

      <BannerPreview banner={previewing} isOpen={preview.isOpen} onOpenChange={preview.setOpen} />

      <ConfirmationDialog isOpen={Boolean(deactivating)} onOpenChange={(open) => !open && setDeactivating(null)} title="Deactivate banner?" description={`“${deactivating?.title ?? "This banner"}” will stop displaying to customers. Its content and schedule are kept, so you can activate it again later.`} confirmLabel="Deactivate" danger isPending={mutations.setStatus.isPending} onConfirm={() => deactivating && void setActive(deactivating, "inactive")} />
      <ConfirmationDialog isOpen={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)} title="Delete banner?" description={`“${deleting?.title ?? "This banner"}” will be permanently removed, together with its own image. This can’t be undone.`} confirmLabel="Delete Banner" danger isPending={mutations.remove.isPending} onConfirm={() => deleting && void remove(deleting)} />
    </AdminPage>
  );
}
