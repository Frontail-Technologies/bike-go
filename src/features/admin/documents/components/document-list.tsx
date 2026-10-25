"use client";

import { Button, Drawer, Dropdown, Label, useOverlayState } from "@heroui/react";
import { ArrowCounterClockwiseIcon, ArrowSquareOutIcon, DotsThreeVerticalIcon, DownloadSimpleIcon, FilePdfIcon, ImageIcon, SealCheckIcon, SlidersHorizontalIcon } from "@phosphor-icons/react";
import type { ColumnDef, OnChangeFn, SortingState } from "@tanstack/react-table";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { AdminSearch, AdminSelect } from "@/components/admin/controls";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { AdminErrorState } from "@/components/admin/feedback";
import { AdminPage, ContentSection, PageHeader } from "@/components/admin/layout";
import { documentTypeLabel, verificationLabels } from "@/features/admin/loans/lib/loan-model";
import { documentTypes, verificationStatuses, type DocumentType, type VerificationStatus } from "@/features/admin/loans/types/loan";
import { ApiError } from "@/lib/api/error";
import { documentFileUrl } from "../api/documents-api";
import { DOCUMENT_PAGE_SIZE, useDocumentListState } from "../hooks/use-document-list-state";
import { useDocumentsQuery, useDocumentStatsQuery } from "../hooks/use-documents";
import type { ReviewDocument, UploadedWindow } from "../types/document";
import { DocumentTypeIcon, fmtShort, isPdf, ReviewStatusBadge } from "./document-parts";

const DocumentReviewDrawer = dynamic(() => import("./document-review-drawer").then((module) => module.DocumentReviewDrawer));

const all = "all";
const dateOptions = [{ value: all, label: "Any upload date" }, { value: "7", label: "Last 7 days" }, { value: "30", label: "Last 30 days" }, { value: "90", label: "Last 90 days" }];
const statCount = { uploaded: "uploaded", verified: "verified", needs_review: "needsReview", rejected: "rejected" } as const;

export function DocumentList({ initialId }: { initialId?: string }) {
  const router = useRouter();
  const filterDrawer = useOverlayState();
  const reviewDrawer = useOverlayState({ defaultOpen: Boolean(initialId) });
  const state = useDocumentListState();
  const { params } = state;
  const query = useDocumentsQuery(params);
  const stats = useDocumentStatsQuery();
  const [selectedId, setSelectedId] = useState<string | null>(initialId ?? null);
  const [searchText, setSearchText] = useState(params.q ?? "");

  // The URL is the source of truth; keep the input in step when it changes from outside (reset, back/forward).
  useEffect(() => { startTransition(() => setSearchText(params.q ?? "")); }, [params.q]);
  useEffect(() => {
    if (searchText.trim() === (params.q ?? "")) return;
    const timer = window.setTimeout(() => state.setFilters({ q: searchText.trim() || undefined }), 300);
    return () => window.clearTimeout(timer);
  }, [searchText]);

  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;
  const pageCount = Math.max(1, query.data?.meta.totalPages ?? 1);
  const page = Math.min(params.page, pageCount);
  const activeFilters = [params.status, params.type, params.uploaded].filter(Boolean).length;
  const filtersActive = Boolean(params.q || activeFilters);
  const reset = () => { setSearchText(""); state.reset(); };
  const sorting: SortingState = params.sort ? [{ id: "uploaded", desc: params.sort === "newest" }] : [];
  const changeSorting: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    state.setFilters({ sort: next[0] ? (next[0].desc ? "newest" : "oldest") : undefined });
  };
  const review = (doc: ReviewDocument) => { setSelectedId(doc.id); reviewDrawer.open(); };
  const openLoan = (doc: { loan: { reference: string } }) => router.push(`/admin/loans/${doc.loan.reference}`);
  const closeReview = (open: boolean) => { reviewDrawer.setOpen(open); if (!open && initialId) router.replace("/admin/documents"); };

  const columns: ColumnDef<ReviewDocument>[] = [
    { id: "applicant", header: "Applicant", enableSorting: false, accessorFn: (row) => row.applicant.name, cell: ({ row }) => <div className="flex min-w-40 items-center gap-2.5"><CustomerAvatar name={row.original.applicant.name} size="sm" className="size-8 text-[11px]" /><div className="min-w-0"><p className="truncate font-bold leading-tight">{row.original.applicant.name}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.applicant.reference}</p></div></div> },
    { id: "loan", header: "Loan application", enableSorting: false, accessorFn: (row) => row.loan.reference, cell: ({ row }) => <div className="whitespace-nowrap"><p className="font-semibold">{row.original.loan.reference}</p><p className="text-xs capitalize text-[var(--admin-muted)]">{row.original.loan.loanType} loan</p></div> },
    { id: "document", header: "Document", enableSorting: false, accessorFn: (row) => row.type, cell: ({ row }) => <div className="flex min-w-44 items-center gap-2.5"><DocumentTypeIcon type={row.original.type} className="size-9" /><div className="min-w-0"><p className="truncate font-semibold leading-tight">{documentTypeLabel(row.original.type)}</p><p className="flex items-center gap-1 truncate text-xs text-[var(--admin-muted)]">{isPdf(row.original.mimeType) ? <FilePdfIcon size={12} aria-hidden /> : <ImageIcon size={12} aria-hidden />}<span className="max-w-36 truncate">{row.original.originalFilename}</span></p></div></div> },
    { id: "uploaded", header: "Uploaded at", accessorFn: (row) => row.uploadedAt, cell: ({ row }) => <span className="whitespace-nowrap text-xs">{fmtShort(row.original.uploadedAt)}</span> },
    { id: "status", header: "Status", enableSorting: false, accessorFn: (row) => row.verificationStatus, cell: ({ row }) => <ReviewStatusBadge status={row.original.verificationStatus} /> },
    { id: "reviewer", header: "Reviewed by", enableSorting: false, accessorFn: (row) => row.reviewedBy?.name, cell: ({ row }) => <span className="whitespace-nowrap text-xs">{row.original.reviewedBy?.name ?? "—"}</span> },
  ];

  const rowActions = (doc: ReviewDocument) => (
    <Dropdown>
      <Button isIconOnly size="sm" variant="ghost" aria-label={`Actions for ${documentTypeLabel(doc.type)} of ${doc.applicant.name}`} className="size-11 min-w-11 md:size-9 md:min-w-9"><DotsThreeVerticalIcon size={20} weight="bold" /></Button>
      <Dropdown.Popover className="adminOverlay">
        <Dropdown.Menu aria-label="Document actions">
          <Dropdown.Item id="open" textValue="Open document" href={documentFileUrl(doc.fileUrl)} target="_blank" rel="noopener noreferrer"><DownloadSimpleIcon size={16} /><Label>Open document</Label></Dropdown.Item>
          <Dropdown.Item id="review" textValue="Review" onAction={() => review(doc)}><SealCheckIcon size={16} /><Label>Review</Label></Dropdown.Item>
          <Dropdown.Item id="loan" textValue="Open loan application" onAction={() => openLoan(doc)}><ArrowSquareOutIcon size={16} /><Label>Open Loan Application</Label></Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );

  const filterControls = (className?: string) => (
    <>
      <AdminSelect className={className} label="All statuses" value={params.status ?? all} onChange={(value) => state.setFilters({ status: value === all ? undefined : (value as VerificationStatus) })} options={[{ value: all, label: "All statuses" }, ...verificationStatuses.map((value) => ({ value, label: verificationLabels[value] }))]} />
      <AdminSelect className={className} label="All document types" value={params.type ?? all} onChange={(value) => state.setFilters({ type: value === all ? undefined : (value as DocumentType) })} options={[{ value: all, label: "All document types" }, ...documentTypes.map((value) => ({ value, label: documentTypeLabel(value) }))]} />
      <AdminSelect className={className} label="Any upload date" value={params.uploaded ?? all} onChange={(value) => state.setFilters({ uploaded: value === all ? undefined : (value as UploadedWindow) })} options={dateOptions} />
    </>
  );
  const emptyText = query.isLoading ? "Loading documents…" : filtersActive ? "No documents match these filters." : "No documents have been uploaded yet.";

  if (query.isError && !query.data) return <AdminPage><PageHeader title="Documents" description="Review and verify documents submitted with loan applications." /><AdminErrorState title="Couldn’t load documents" description={query.error instanceof ApiError ? query.error.message : "Try again in a moment."} onRetry={() => void query.refetch()} /></AdminPage>;

  return (
    <AdminPage>
      <PageHeader title="Documents" description="Review and verify documents submitted with loan applications." />
      <ul aria-label="Review queue summary" aria-busy={stats.isLoading} className="flex flex-wrap gap-2">
        {verificationStatuses.map((value) => <li key={value}><button type="button" onClick={() => state.setFilters({ status: params.status === value ? undefined : value })} aria-pressed={params.status === value} className="adminTile flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--admin-accent-strong)] aria-pressed:border-[var(--admin-accent-strong)] aria-pressed:bg-[var(--admin-accent-soft)]"><ReviewStatusBadge status={value} /><strong className="tabular-nums">{stats.data ? stats.data[statCount[value]] : "—"}</strong></button></li>)}
      </ul>
      <ContentSection className="overflow-visible">
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <AdminSearch className="w-auto min-w-0 max-w-none flex-1 basis-0 sm:max-w-xl" value={searchText} onChange={setSearchText} placeholder="Search applicant, loan reference or file…" />
            <Button variant="outline" className="relative min-h-11 shrink-0 lg:hidden" onPress={filterDrawer.open} aria-label={`Filters${activeFilters ? `, ${activeFilters} active` : ""}`}>
              <SlidersHorizontalIcon size={18} /><span className="max-sm:sr-only">Filters</span>
              {activeFilters ? <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--admin-accent)] text-[11px] font-extrabold text-[#111820]">{activeFilters}</span> : null}
            </Button>
          </div>
          <div className="hidden flex-wrap items-center gap-2 lg:flex">
            {filterControls()}
            {filtersActive ? <Button size="sm" variant="ghost" className="min-h-10" onPress={reset}><ArrowCounterClockwiseIcon size={15} />Reset filters</Button> : null}
            <p className="ml-auto text-xs font-semibold text-[var(--admin-muted)]" aria-live="polite">{total} document{total === 1 ? "" : "s"}</p>
          </div>
        </div>
        <AdminDataTable columns={columns} data={rows} label="Documents" emptyState={emptyText} pagination={{ page, pageSize: DOCUMENT_PAGE_SIZE, total, onPageChange: state.setPage }} manualSorting sorting={sorting} onSortingChange={changeSorting} loading={query.isLoading} onRowNavigate={review} rowActions={rowActions} minWidth={900} />
      </ContentSection>

      <Drawer.Backdrop isOpen={filterDrawer.isOpen} onOpenChange={filterDrawer.setOpen} className="adminOverlay">
        <Drawer.Content placement="right" className="w-full max-w-md">
          <Drawer.Dialog aria-label="Filter documents">
            <Drawer.CloseTrigger />
            <Drawer.Header><Drawer.Heading>Filter documents</Drawer.Heading></Drawer.Header>
            <Drawer.Body className="grid gap-3">{filterControls("w-full")}</Drawer.Body>
            <Drawer.Footer className="grid grid-cols-2 gap-2">
              <Button variant="tertiary" className="min-h-11" isDisabled={!filtersActive} onPress={reset}>Reset</Button>
              <Button variant="primary" className="min-h-11" onPress={filterDrawer.close}>Show {total} document{total === 1 ? "" : "s"}</Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>

      {selectedId ? <DocumentReviewDrawer documentId={selectedId} isOpen={reviewDrawer.isOpen} onOpenChange={closeReview} onOpenLoan={openLoan} /> : null}
    </AdminPage>
  );
}
