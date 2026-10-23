"use client";

import { Button, Drawer, Dropdown, Label, useOverlayState } from "@heroui/react";
import { ArrowCounterClockwiseIcon, ArrowSquareOutIcon, DotsThreeVerticalIcon, EyeIcon, FilePdfIcon, GridFourIcon, ImageIcon, ListIcon, SealCheckIcon, SlidersHorizontalIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";
import { AdminPagination, AdminSearch, AdminSelect, ViewToggle } from "@/components/admin/controls";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { AdminPage, ContentSection, PageHeader } from "@/components/admin/layout";
import { AdminDocumentCard } from "./admin-document-card";
import { allDocumentTypes, documents as seed, fmtShort, NOW, type ReviewDocument, reviewLabels, reviewStatuses, type ReviewStatus } from "./document-data";
import { DocumentTypeIcon, ReviewStatusBadge } from "./document-parts";
import { DocumentReviewDrawer } from "./document-review-drawer";

const PAGE_SIZE = 8;
const all = "all";
type ViewMode = "table" | "cards";
const DAY = 86_400_000;
const dateOptions = [{ value: all, label: "Any upload date" }, { value: "7", label: "Last 7 days" }, { value: "30", label: "Last 30 days" }, { value: "90", label: "Last 90 days" }];
const reviewers = ["Sophea Admin"];

export function DocumentList({ initialId }: { initialId?: string }) {
  const router = useRouter();
  const filterDrawer = useOverlayState();
  const reviewDrawer = useOverlayState({ defaultOpen: Boolean(initialId && seed.some((doc) => doc.id === initialId)) });
  const [items, setItems] = useState<ReviewDocument[]>(seed);
  const [selectedId, setSelectedId] = useState<string | null>(initialId ?? null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(all);
  const [type, setType] = useState(all);
  const [dates, setDates] = useState(all);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<ViewMode>("table");

  useEffect(() => {
    const saved = window.localStorage.getItem("ridego-admin-document-view");
    const next: ViewMode = saved === "table" || saved === "cards" ? saved : window.innerWidth < 768 ? "cards" : "table";
    startTransition(() => setView(next));
  }, []);
  function changeView(next: ViewMode) { setView(next); window.localStorage.setItem("ridego-admin-document-view", next); }

  const filtered = useMemo(() => items.filter((doc) => {
    const term = search.trim().toLowerCase();
    return (!term || `${doc.applicant.name} ${doc.applicant.reference} ${doc.loanReference} ${doc.fileName}`.toLowerCase().includes(term))
      && (status === all || doc.status === status) && (type === all || doc.type === type) && (dates === all || NOW - Date.parse(doc.uploadedAt) <= Number(dates) * DAY);
  }).sort((a, b) => Date.parse(b.uploadedAt) - Date.parse(a.uploadedAt)), [items, search, status, type, dates]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const activeFilters = [status, type, dates].filter((value) => value !== all).length;
  const filtersActive = Boolean(search || activeFilters);
  const update = (setter: (value: string) => void) => (value: string) => { setter(value); setPage(1); };
  const reset = () => { setSearch(""); setStatus(all); setType(all); setDates(all); setPage(1); };
  const selected = items.find((doc) => doc.id === selectedId) ?? null;
  const review = (doc: ReviewDocument) => { setSelectedId(doc.id); reviewDrawer.open(); };
  const openLoan = (doc: ReviewDocument) => router.push(`/admin/loans/${doc.loanReference}`);

  function applyReview(doc: ReviewDocument, next: Exclude<ReviewStatus, "uploaded">, note: string) {
    const now = new Date(NOW).toISOString();
    const title = next === "verified" ? "Verified" : next === "rejected" ? "Rejected" : "Marked needs review";
    setItems((current) => current.map((item) => item.id === doc.id ? { ...item, status: next, reviewedBy: reviewers[0], history: [...item.history, { id: `${next}-${item.history.length}`, title, detail: note || undefined, at: now }] } : item));
  }

  const stats = reviewStatuses.map((value) => ({ value, count: items.filter((doc) => doc.status === value).length }));

  const columns: ColumnDef<ReviewDocument>[] = [
    { id: "applicant", header: "Applicant", accessorFn: (row) => row.applicant.name, cell: ({ row }) => <div className="flex min-w-40 items-center gap-2.5"><CustomerAvatar name={row.original.applicant.name} size="sm" className="size-8 text-[11px]" /><div className="min-w-0"><p className="truncate font-bold leading-tight">{row.original.applicant.name}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.applicant.reference}</p></div></div> },
    { id: "loan", header: "Loan application", accessorFn: (row) => row.loanReference, cell: ({ row }) => <div className="whitespace-nowrap"><p className="font-semibold">{row.original.loanReference}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.loanType}</p></div> },
    { id: "document", header: "Document", accessorFn: (row) => row.type, cell: ({ row }) => <div className="flex min-w-44 items-center gap-2.5"><DocumentTypeIcon type={row.original.type} className="size-9" /><div className="min-w-0"><p className="truncate font-semibold leading-tight">{row.original.type}</p><p className="flex items-center gap-1 truncate text-xs text-[var(--admin-muted)]">{row.original.format === "pdf" ? <FilePdfIcon size={12} aria-hidden /> : <ImageIcon size={12} aria-hidden />}<span className="max-w-36 truncate">{row.original.fileName}</span></p></div></div> },
    { accessorKey: "uploadedAt", header: "Uploaded at", cell: ({ row }) => <span className="whitespace-nowrap text-xs">{fmtShort(row.original.uploadedAt)}</span> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <ReviewStatusBadge status={row.original.status} /> },
    { accessorKey: "reviewedBy", header: "Reviewed by", cell: ({ row }) => <span className="whitespace-nowrap text-xs">{row.original.reviewedBy ?? "—"}</span> },
  ];
  const data = rows.map((doc) => ({ ...doc, id: doc.id }));

  const rowActions = (doc: ReviewDocument) => (
    <Dropdown>
      <Button isIconOnly size="sm" variant="ghost" aria-label={`Actions for ${doc.type} of ${doc.applicant.name}`} className="size-11 min-w-11 md:size-9 md:min-w-9"><DotsThreeVerticalIcon size={20} weight="bold" /></Button>
      <Dropdown.Popover className="adminOverlay">
        <Dropdown.Menu aria-label="Document actions">
          <Dropdown.Item id="preview" textValue="Preview" onAction={() => review(doc)}><EyeIcon size={16} /><Label>Preview</Label></Dropdown.Item>
          <Dropdown.Item id="review" textValue="Review" onAction={() => review(doc)}><SealCheckIcon size={16} /><Label>Review</Label></Dropdown.Item>
          <Dropdown.Item id="loan" textValue="Open loan application" onAction={() => openLoan(doc)}><ArrowSquareOutIcon size={16} /><Label>Open Loan Application</Label></Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );

  const filterControls = (className?: string) => (
    <>
      <AdminSelect className={className} label="All statuses" value={status} onChange={update(setStatus)} options={[{ value: all, label: "All statuses" }, ...reviewStatuses.map((value) => ({ value, label: reviewLabels[value] }))]} />
      <AdminSelect className={className} label="All document types" value={type} onChange={update(setType)} options={[{ value: all, label: "All document types" }, ...allDocumentTypes.map((value) => ({ value, label: value }))]} />
      <AdminSelect className={className} label="Any upload date" value={dates} onChange={update(setDates)} options={dateOptions} />
    </>
  );
  const empty = <p className="py-12 text-center text-sm text-[var(--admin-muted)]">No documents match these filters.</p>;
  const pagination = <div className="border-t border-[var(--admin-border)]"><AdminPagination page={safePage} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} /></div>;

  return (
    <AdminPage>
      <PageHeader title="Documents" description="Review and verify documents submitted with loan applications." />
      <ul aria-label="Review queue summary" className="flex flex-wrap gap-2">
        {stats.map((stat) => <li key={stat.value}><button type="button" onClick={() => update(setStatus)(status === stat.value ? all : stat.value)} aria-pressed={status === stat.value} className="adminTile flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--admin-accent-strong)] aria-pressed:border-[var(--admin-accent-strong)] aria-pressed:bg-[var(--admin-accent-soft)]"><ReviewStatusBadge status={stat.value} /><strong className="tabular-nums">{stat.count}</strong></button></li>)}
      </ul>
      <ContentSection className="overflow-visible">
        <div className="space-y-3 border-b border-[var(--admin-border)] p-4">
          <div className="flex items-center gap-2">
            <AdminSearch className="w-auto min-w-0 max-w-none flex-1 basis-0 sm:max-w-xl" value={search} onChange={update(setSearch)} placeholder="Search applicant or loan reference…" />
            <Button variant="outline" className="relative min-h-11 shrink-0 lg:hidden" onPress={filterDrawer.open} aria-label={`Filters${activeFilters ? `, ${activeFilters} active` : ""}`}>
              <SlidersHorizontalIcon size={18} /><span className="max-sm:sr-only">Filters</span>
              {activeFilters ? <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--admin-accent)] text-[11px] font-extrabold text-[#111820]">{activeFilters}</span> : null}
            </Button>
            <div className="ml-auto"><ViewToggle label="Document view" value={view} onChange={changeView} options={[{ value: "table", label: "Table", icon: <ListIcon size={17} /> }, { value: "cards", label: "Cards", icon: <GridFourIcon size={17} /> }]} /></div>
          </div>
          <div className="hidden flex-wrap items-center gap-2 lg:flex">
            {filterControls()}
            {filtersActive ? <Button size="sm" variant="ghost" className="min-h-10" onPress={reset}><ArrowCounterClockwiseIcon size={15} />Reset filters</Button> : null}
            <p className="ml-auto text-xs font-semibold text-[var(--admin-muted)]" aria-live="polite">{filtered.length} document{filtered.length === 1 ? "" : "s"}</p>
          </div>
        </div>
        {view === "table" ? (
          <AdminDataTable columns={columns as ColumnDef<ReviewDocument & { id: string }>[]} data={data} label="Documents" emptyState="No documents match these filters." pagination={{ page: safePage, pageSize: PAGE_SIZE, total: filtered.length, onPageChange: setPage }} onRowNavigate={review} rowActions={rowActions} minWidth={900} />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3 2xl:grid-cols-4">
              {rows.map((doc) => <AdminDocumentCard key={doc.id} document={doc} onReview={review} onOpenLoan={openLoan} />)}
              {!rows.length ? <div className="col-span-full">{empty}</div> : null}
            </div>
            {pagination}
          </>
        )}
      </ContentSection>

      <Drawer.Backdrop isOpen={filterDrawer.isOpen} onOpenChange={filterDrawer.setOpen} className="adminOverlay">
        <Drawer.Content placement="right" className="w-full max-w-md">
          <Drawer.Dialog aria-label="Filter documents">
            <Drawer.CloseTrigger />
            <Drawer.Header><Drawer.Heading>Filter documents</Drawer.Heading></Drawer.Header>
            <Drawer.Body className="grid gap-3">{filterControls("w-full")}</Drawer.Body>
            <Drawer.Footer className="grid grid-cols-2 gap-2">
              <Button variant="tertiary" className="min-h-11" isDisabled={!filtersActive} onPress={reset}>Reset</Button>
              <Button variant="primary" className="min-h-11" onPress={filterDrawer.close}>Show {filtered.length} document{filtered.length === 1 ? "" : "s"}</Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>

      <DocumentReviewDrawer document={selected} isOpen={reviewDrawer.isOpen} onOpenChange={reviewDrawer.setOpen} onReview={applyReview} onOpenLoan={openLoan} />
    </AdminPage>
  );
}
