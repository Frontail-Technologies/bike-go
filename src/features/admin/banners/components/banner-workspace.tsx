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
import { activeFilterCount, pageCount as getPageCount } from "@/hooks/use-list-state";
import { BANNER_PAGE_SIZE, useBannerListState } from "../hooks/use-banner-list-state";
import { useBannerMutations, useBannersQuery } from "../hooks/use-banners";
import { formatSchedule, placementMeta } from "../lib/banner-model";
import { bannerStatuses, placements, type Banner, type BannerPlacement, type BannerSort, type BannerStatus } from "../types/banner";
import { AdminBannerCard } from "./admin-banner-card";
import { BannerImage } from "./banner-image";
import { BannerOrder } from "./banner-order";
import { BannerActions, type BannerHandlers, PlacementBadge } from "./banner-parts";
import { BannerPreview } from "./banner-preview";
import { useUrlSearchInput } from "@/hooks/use-url-search-input";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";
import { adminLabels, adminT } from "@/features/admin/i18n/translate";

const all = "all";
type ViewMode = "table" | "cards";
const statusLabels: Record<BannerStatus, string> = adminLabels("banners.status", bannerStatuses);
const failure = (error: unknown) => (error instanceof ApiError ? error.message : adminT("common.genericError"));

const sortColumns: Record<string, BannerSort> = { title: "title", displayOrder: "displayOrder", schedule: "startAt" };
const sortingFor = (sort: BannerSort | undefined): SortingState => {
  const found = Object.entries(sortColumns).find(([, key]) => key === sort);
  return found ? [{ id: found[0], desc: false }] : [];
};

export function BannerWorkspace() {
  const t = useAdminTranslations();
  const router = useRouter();
  const filterDrawer = useOverlayState();
  const preview = useOverlayState();
  const state = useBannerListState();
  const { params } = state;
  const query = useBannersQuery(params);
  const mutations = useBannerMutations();
  const [view, setView] = useState<ViewMode>("table");
  const [tab, setTab] = useState("banners");
  const [searchText, setSearchText] = useUrlSearchInput(params.q, (q) => state.setFilters({ q }));
  const [previewing, setPreviewing] = useState<Banner | null>(null);
  const [deactivating, setDeactivating] = useState<Banner | null>(null);
  const [deleting, setDeleting] = useState<Banner | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("ridego-admin-banner-view");
    const next: ViewMode = saved === "table" || saved === "cards" ? saved : window.innerWidth < 768 ? "cards" : "table";
    startTransition(() => setView(next));
  }, []);
  function changeView(next: ViewMode) { setView(next); window.localStorage.setItem("ridego-admin-banner-view", next); }

  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;
  const pageCount = getPageCount(query.data?.meta);
  const page = Math.min(params.page, pageCount);
  const activeFilters = activeFilterCount(params, ["page", "pageSize", "sort", "q"]);
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
      toast.success(t(status === "active" ? "banners.activated" : "banners.deactivated", { name: banner.title }));
    } catch (error) {
      toast.danger(failure(error));
    }
    setDeactivating(null);
  }
  async function remove(banner: Banner) {
    try {
      await mutations.remove.mutateAsync(banner.id);
      toast.success(t("banners.deleted", { name: banner.title }));
    } catch (error) {
      toast.danger(failure(error));
    }
    setDeleting(null);
  }
  async function duplicate(banner: Banner) {
    try {
      const copy = await mutations.duplicate.mutateAsync(banner);
      toast.success(t("banners.created", { name: copy.title }), { description: t("banners.copyHint") });
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
    { id: "title", header: t("banners.columns.banner"), accessorFn: (row) => row.title, cell: ({ row }) => (
      <div className="flex min-w-60 items-center gap-3">
        <BannerImage banner={row.original} className="h-12 w-[84px] shrink-0 rounded-lg border border-[var(--admin-border)]" sizes="84px" />
        <div className="min-w-0"><p className="truncate font-bold leading-tight">{row.original.title}</p><p className="truncate text-xs text-[var(--admin-muted)]">{row.original.subtitle ?? ""}</p></div>
      </div>
    ) },
    { id: "placement", header: t("banners.columns.placement"), enableSorting: false, accessorFn: (row) => row.placement, cell: ({ row }) => <PlacementBadge placement={row.original.placement} /> },
    { id: "status", header: t("banners.columns.status"), enableSorting: false, accessorFn: (row) => row.effectiveStatus, cell: ({ row }) => <AdminStatusBadge status={row.original.effectiveStatus} /> },
    { id: "displayOrder", header: t("banners.columns.displayOrder"), accessorFn: (row) => row.displayOrder, cell: ({ row }) => <span className="font-semibold tabular-nums">{row.original.displayOrder}</span> },
    { id: "schedule", header: t("banners.columns.schedule"), accessorFn: (row) => row.startAt ?? "", cell: ({ row }) => <span className="whitespace-nowrap text-xs">{formatSchedule(row.original)}</span> },
  ];

  const filterControls = (className?: string) => (
    <>
      <AdminSelect className={className} label={t("banners.allPlacements")} value={params.placement ?? all} onChange={(value) => state.setFilters({ placement: value === all ? undefined : (value as BannerPlacement) })} options={[{ value: all, label: t("banners.allPlacements") }, ...placements.map((value) => ({ value, label: placementMeta[value].label }))]} />
      <AdminSelect className={className} label={t("filters.allStatuses")} value={params.status ?? all} onChange={(value) => state.setFilters({ status: value === all ? undefined : (value as BannerStatus) })} options={[{ value: all, label: t("filters.allStatuses") }, ...bannerStatuses.map((value) => ({ value, label: statusLabels[value] }))]} />
    </>
  );

  const emptyText = query.isLoading ? t("banners.loading") : filtersActive ? t("banners.noMatches") : t("banners.empty");
  const empty = <p className="py-12 text-center text-sm text-[var(--admin-muted)]">{emptyText}</p>;

  const list = query.isError && !query.data ? (
    <AdminErrorState title={t("banners.loadError")} description={failure(query.error)} onRetry={() => void query.refetch()} />
  ) : (
    <ContentSection className="overflow-visible">
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <AdminSearch className="w-auto min-w-0 max-w-none flex-1 basis-0 sm:max-w-md" value={searchText} onChange={setSearchText} placeholder={t("pages.banners.search")} />
          <Button variant="outline" className="relative min-h-11 shrink-0 lg:hidden" onPress={filterDrawer.open} aria-label={activeFilters ? t("filters.activeCount", { count: activeFilters }) : t("filters.filters")}>
            <SlidersHorizontalIcon size={18} /><span className="max-sm:sr-only">{t("filters.filters")}</span>
            {activeFilters ? <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--admin-accent)] text-[11px] font-extrabold text-[#111820]">{activeFilters}</span> : null}
          </Button>
          <div className="hidden items-center gap-2 lg:flex">{filterControls()}{filtersActive ? <Button size="sm" variant="ghost" className="min-h-10" onPress={reset}><ArrowCounterClockwiseIcon size={15} />{t("filters.resetFilters")}</Button> : null}</div>
          <div className="ml-auto"><ViewToggle label={t("banners.view")} value={view} onChange={changeView} options={[{ value: "table", label: t("ui.table"), icon: <ListIcon size={17} /> }, { value: "cards", label: t("ui.cards"), icon: <GridFourIcon size={17} /> }]} /></div>
        </div>
        {filtersActive ? <p className="text-xs font-semibold text-[var(--admin-muted)] lg:hidden" aria-live="polite">{t(total === 1 ? "banners.countOne" : "banners.count", { count: total })} <button type="button" className="ml-2 font-bold text-[var(--admin-accent-strong)] underline" onClick={reset}>{t("filters.resetFilters")}</button></p> : null}
      </div>
      {view === "table" ? (
        <AdminDataTable columns={columns} data={rows} label={t("pages.banners.title")} emptyState={emptyText} pagination={{ page, pageSize: BANNER_PAGE_SIZE, total, onPageChange: state.setPage }} manualSorting sorting={sorting} onSortingChange={changeSorting} loading={query.isLoading} onRowNavigate={handlers.onEdit} rowActions={(banner) => <BannerActions banner={banner} handlers={handlers} />} minWidth={820} />
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
      <PageHeader title={t("pages.banners.title")} description={t("pages.banners.description")} actions={<Button variant="primary" className="min-h-11" onPress={() => router.push("/admin/banners/new")}><PlusIcon />{t("pages.banners.add")}</Button>} />
      <AdminTabs label={t("banners.tabs.label")} selectedKey={tab} onSelectionChange={setTab} items={[
        { id: "banners", label: t("banners.tabs.all"), content: list },
        { id: "order", label: t("banners.tabs.order"), content: <BannerOrder handlers={handlers} /> },
      ]} />

      <Drawer.Backdrop isOpen={filterDrawer.isOpen} onOpenChange={filterDrawer.setOpen} className="adminOverlay">
        <Drawer.Content placement="bottom">
          <Drawer.Dialog aria-label={t("banners.filterTitle")}>
            <Drawer.Handle />
            <Drawer.Header><Drawer.Heading>{t("banners.filterTitle")}</Drawer.Heading></Drawer.Header>
            <Drawer.Body className="grid gap-3 overflow-y-auto">{filterControls("w-full")}</Drawer.Body>
            <Drawer.Footer className="grid grid-cols-2 gap-2">
              <Button variant="tertiary" className="min-h-11" isDisabled={!filtersActive} onPress={reset}>{t("filters.reset")}</Button>
              <Button variant="primary" className="min-h-11" onPress={filterDrawer.close}>{t(total === 1 ? "banners.showOne" : "banners.show", { count: total })}</Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>

      <BannerPreview banner={previewing} isOpen={preview.isOpen} onOpenChange={preview.setOpen} />

      <ConfirmationDialog isOpen={Boolean(deactivating)} onOpenChange={(open) => !open && setDeactivating(null)} title={t("banners.deactivateTitle")} description={t("banners.deactivateDescription", { name: deactivating?.title ?? t("banners.thisBanner") })} confirmLabel={t("actions.deactivate")} danger isPending={mutations.setStatus.isPending} onConfirm={() => deactivating && void setActive(deactivating, "inactive")} />
      <ConfirmationDialog isOpen={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)} title={t("banners.deleteTitle")} description={t("banners.deleteDescription", { name: deleting?.title ?? t("banners.thisBanner") })} confirmLabel={t("banners.deleteConfirm")} danger isPending={mutations.remove.isPending} onConfirm={() => deleting && void remove(deleting)} />
    </AdminPage>
  );
}
