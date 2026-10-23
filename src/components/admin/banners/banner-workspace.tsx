"use client";

import { Button, Drawer, useOverlayState } from "@heroui/react";
import { ArrowCounterClockwiseIcon, GridFourIcon, ListIcon, PlusIcon, SlidersHorizontalIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";
import { AdminPagination, AdminSearch, AdminSelect, ViewToggle } from "@/components/admin/controls";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { ConfirmationDialog } from "@/components/admin/feedback";
import { AdminPage, ContentSection, PageHeader } from "@/components/admin/layout";
import { AdminTabs } from "@/components/admin/navigation";
import { AdminBannerCard } from "./admin-banner-card";
import { BannerImage } from "./banner-image";
import { type Banner, effectiveStatus, formatSchedule, initialBanners, NOW, placementMeta, placements, renumber } from "./banner-data";
import { BannerOrder } from "./banner-order";
import { BannerActions, type BannerHandlers, PlacementBadge } from "./banner-parts";
import { BannerPreview } from "./banner-preview";

const PAGE_SIZE = 8;
const all = "all";
type ViewMode = "table" | "cards";

const statusOptions = [
  { value: all, label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "scheduled", label: "Scheduled" },
  { value: "inactive", label: "Inactive" },
  { value: "expired", label: "Expired" },
];
const scheduleOptions = [
  { value: all, label: "All dates" },
  { value: "running", label: "Running now" },
  { value: "upcoming", label: "Starts later" },
  { value: "ended", label: "Already ended" },
];

export function BannerWorkspace() {
  const router = useRouter();
  const filterDrawer = useOverlayState();
  const preview = useOverlayState();
  const [banners, setBanners] = useState<Banner[]>(() => renumber(initialBanners));
  const [search, setSearch] = useState("");
  const [placement, setPlacement] = useState(all);
  const [status, setStatus] = useState(all);
  const [schedule, setSchedule] = useState(all);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<ViewMode>("table");
  const [tab, setTab] = useState("banners");
  const [previewing, setPreviewing] = useState<Banner | null>(null);
  const [deactivating, setDeactivating] = useState<Banner | null>(null);
  const [deleting, setDeleting] = useState<Banner | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("ridego-admin-banner-view");
    const next: ViewMode = saved === "table" || saved === "cards" ? saved : window.innerWidth < 768 ? "cards" : "table";
    startTransition(() => setView(next));
  }, []);
  function changeView(next: ViewMode) { setView(next); window.localStorage.setItem("ridego-admin-banner-view", next); }

  const filtered = useMemo(() => banners.filter((banner) => {
    const term = search.trim().toLowerCase();
    const start = banner.startAt ? Date.parse(banner.startAt) : -Infinity;
    const end = banner.endAt ? Date.parse(banner.endAt) : Infinity;
    return (!term || `${banner.title} ${banner.subtitle} ${banner.ctaLabel}`.toLowerCase().includes(term))
      && (placement === all || banner.placement === placement) && (status === all || effectiveStatus(banner) === status)
      && (schedule === all || (schedule === "running" && start <= NOW && end >= NOW) || (schedule === "upcoming" && start > NOW) || (schedule === "ended" && end < NOW));
  }).sort((a, b) => placements.indexOf(a.placement) - placements.indexOf(b.placement) || a.displayOrder - b.displayOrder), [banners, search, placement, status, schedule]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const activeFilters = [placement, status, schedule].filter((value) => value !== all).length;
  const filtersActive = Boolean(search || activeFilters);
  const update = (setter: (value: string) => void) => (value: string) => { setter(value); setPage(1); };
  const reset = () => { setSearch(""); setPlacement(all); setStatus(all); setSchedule(all); setPage(1); };

  const handlers: BannerHandlers = {
    onEdit: (banner) => router.push(`/admin/banners/${banner.id}/edit`),
    onPreview: (banner) => { setPreviewing(banner); preview.open(); },
    onToggle: (banner) => banner.status === "inactive" ? setBanners((current) => current.map((item) => item.id === banner.id ? { ...item, status: "active" } : item)) : setDeactivating(banner),
    onDuplicate: (banner) => setBanners((current) => renumber([...current, { ...banner, id: `banner-copy-${Date.now()}`, title: `${banner.title} (copy)`, status: "inactive", displayOrder: current.length + 1 }])),
    onDelete: setDeleting,
  };

  const columns: ColumnDef<Banner>[] = [
    { accessorKey: "title", header: "Banner", cell: ({ row }) => (
      <div className="flex min-w-60 items-center gap-3">
        <BannerImage banner={row.original} textless className="h-12 w-[84px] shrink-0 rounded-lg border border-[var(--admin-border)]" sizes="84px" />
        <div className="min-w-0"><p className="truncate font-bold leading-tight">{row.original.title}</p><p className="truncate text-xs text-[var(--admin-muted)]">{row.original.subtitle}</p></div>
      </div>
    ) },
    { accessorKey: "placement", header: "Placement", cell: ({ row }) => <PlacementBadge placement={row.original.placement} /> },
    { id: "status", header: "Status", accessorFn: (row) => effectiveStatus(row), cell: ({ row }) => <AdminStatusBadge status={effectiveStatus(row.original)} /> },
    { accessorKey: "displayOrder", header: "Display order", cell: ({ row }) => <span className="font-semibold tabular-nums">{row.original.displayOrder}</span> },
    { id: "schedule", header: "Schedule", accessorFn: (row) => row.startAt ?? "", cell: ({ row }) => <span className="whitespace-nowrap text-xs">{formatSchedule(row.original)}</span> },
  ];

  const filterControls = (className?: string) => (
    <>
      <AdminSelect className={className} label="All placements" value={placement} onChange={update(setPlacement)} options={[{ value: all, label: "All placements" }, ...placements.map((value) => ({ value, label: placementMeta[value].label }))]} />
      <AdminSelect className={className} label="All statuses" value={status} onChange={update(setStatus)} options={statusOptions} />
      <AdminSelect className={className} label="All dates" value={schedule} onChange={update(setSchedule)} options={scheduleOptions} />
    </>
  );

  const empty = <p className="py-12 text-center text-sm text-[var(--admin-muted)]">No banners match these filters.</p>;
  const pagination = <div className="border-t border-[var(--admin-border)]"><AdminPagination page={safePage} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} /></div>;

  const list = (
    <ContentSection className="overflow-visible">
      <div className="space-y-3 border-b border-[var(--admin-border)] p-4">
        <div className="flex items-center gap-2">
          <AdminSearch className="w-auto min-w-0 max-w-none flex-1 basis-0 sm:max-w-md" value={search} onChange={update(setSearch)} placeholder="Search banners…" />
          <Button variant="outline" className="relative min-h-11 shrink-0 lg:hidden" onPress={filterDrawer.open} aria-label={`Filters${activeFilters ? `, ${activeFilters} active` : ""}`}>
            <SlidersHorizontalIcon size={18} /><span className="max-sm:sr-only">Filters</span>
            {activeFilters ? <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--admin-accent)] text-[11px] font-extrabold text-[#111820]">{activeFilters}</span> : null}
          </Button>
          <div className="hidden items-center gap-2 lg:flex">{filterControls()}{filtersActive ? <Button size="sm" variant="ghost" className="min-h-10" onPress={reset}><ArrowCounterClockwiseIcon size={15} />Reset filters</Button> : null}</div>
          <div className="ml-auto"><ViewToggle label="Banner view" value={view} onChange={changeView} options={[{ value: "table", label: "Table", icon: <ListIcon size={17} /> }, { value: "cards", label: "Cards", icon: <GridFourIcon size={17} /> }]} /></div>
        </div>
        {filtersActive ? <p className="text-xs font-semibold text-[var(--admin-muted)] lg:hidden" aria-live="polite">{filtered.length} banner{filtered.length === 1 ? "" : "s"} <button type="button" className="ml-2 font-bold text-[var(--admin-info)] underline" onClick={reset}>Reset filters</button></p> : null}
      </div>
      {view === "table" ? (
        <AdminDataTable columns={columns} data={rows} label="Banners" emptyState="No banners match these filters." pagination={{ page: safePage, pageSize: PAGE_SIZE, total: filtered.length, onPageChange: setPage }} onRowNavigate={handlers.onEdit} rowActions={(banner) => <BannerActions banner={banner} handlers={handlers} />} minWidth={820} />
      ) : (
        <>
          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
            {rows.map((banner) => <AdminBannerCard key={banner.id} banner={banner} handlers={handlers} />)}
            {!rows.length ? <div className="col-span-full">{empty}</div> : null}
          </div>
          {pagination}
        </>
      )}
    </ContentSection>
  );

  return (
    <AdminPage>
      <PageHeader title="Banners" description="Manage promotional banners across different placements and schedules." actions={<Button variant="primary" className="min-h-11" onPress={() => router.push("/admin/banners/new")}><PlusIcon />Add Banner</Button>} />
      <AdminTabs label="Banner views" selectedKey={tab} onSelectionChange={setTab} items={[
        { id: "banners", label: "All Banners", content: list },
        { id: "order", label: "Order & Placement", content: <BannerOrder banners={banners} onChange={setBanners} handlers={handlers} /> },
      ]} />

      <Drawer.Backdrop isOpen={filterDrawer.isOpen} onOpenChange={filterDrawer.setOpen} className="adminOverlay">
        <Drawer.Content placement="bottom" className="mx-auto w-full max-w-lg rounded-t-3xl">
          <Drawer.Dialog aria-label="Filter banners">
            <Drawer.CloseTrigger />
            <Drawer.Header><Drawer.Heading>Filter banners</Drawer.Heading></Drawer.Header>
            <Drawer.Body className="grid gap-3">{filterControls("w-full")}</Drawer.Body>
            <Drawer.Footer className="grid grid-cols-2 gap-2">
              <Button variant="tertiary" className="min-h-11" isDisabled={!filtersActive} onPress={reset}>Reset</Button>
              <Button variant="primary" className="min-h-11" onPress={filterDrawer.close}>Show {filtered.length} banner{filtered.length === 1 ? "" : "s"}</Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>

      <BannerPreview banner={previewing} isOpen={preview.isOpen} onOpenChange={preview.setOpen} />

      <ConfirmationDialog isOpen={Boolean(deactivating)} onOpenChange={(open) => !open && setDeactivating(null)} title="Deactivate banner?" description={`“${deactivating?.title ?? "This banner"}” will stop displaying to customers. Its content and schedule are kept, so you can activate it again later.`} confirmLabel="Deactivate Banner" danger onConfirm={() => { if (deactivating) setBanners((current) => current.map((item) => item.id === deactivating.id ? { ...item, status: "inactive" } : item)); setDeactivating(null); }} />
      <ConfirmationDialog isOpen={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)} title="Delete banner?" description={`“${deleting?.title ?? "This banner"}” will be permanently removed. Its image may also be removed once the backend is connected. This can’t be undone.`} confirmLabel="Delete Banner" danger onConfirm={() => { if (deleting) setBanners((current) => renumber(current.filter((item) => item.id !== deleting.id))); setDeleting(null); }} />
    </AdminPage>
  );
}
