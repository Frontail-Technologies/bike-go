"use client";

import { Button, Drawer, Dropdown, Label, useOverlayState } from "@heroui/react";
import { ArrowCounterClockwiseIcon, ArrowSquareOutIcon, DotsThreeVerticalIcon, DownloadSimpleIcon, FilePdfIcon, ImageIcon, SealCheckIcon, SlidersHorizontalIcon } from "@phosphor-icons/react";
import type { ColumnDef, OnChangeFn, SortingState } from "@tanstack/react-table";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminSearch, AdminSelect } from "@/components/admin/controls";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { AdminErrorState } from "@/components/admin/feedback";
import { AdminPage, ContentSection, PageHeader } from "@/components/admin/layout";
import { documentTypeLabel, loanTypeLabel, verificationLabels } from "@/features/admin/loans/lib/loan-model";
import { documentTypes, verificationStatuses, type DocumentType, type VerificationStatus } from "@/features/admin/loans/types/loan";
import { ApiError } from "@/lib/api/error";
import { activeFilterCount, pageCount as getPageCount } from "@/hooks/use-list-state";
import { documentFileUrl } from "../api/documents-api";
import { DOCUMENT_PAGE_SIZE, useDocumentListState } from "../hooks/use-document-list-state";
import { useDocumentsQuery, useDocumentStatsQuery } from "../hooks/use-documents";
import type { ReviewDocument, UploadedWindow } from "../types/document";
import { DocumentTypeIcon, fmtShort, isPdf, ReviewStatusBadge } from "./document-parts";
import { useUrlSearchInput } from "@/hooks/use-url-search-input";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

const DocumentReviewDrawer = dynamic(() => import("./document-review-drawer").then((module) => module.DocumentReviewDrawer));

const all = "all";
const dateOptions = [all, "7", "30", "90"] as const;
const statCount = { uploaded: "uploaded", verified: "verified", needs_review: "needsReview", rejected: "rejected" } as const;

export function DocumentList({ initialId }: { initialId?: string }) {
  const t = useAdminTranslations();
  const router = useRouter();
  const filterDrawer = useOverlayState();
  const reviewDrawer = useOverlayState({ defaultOpen: Boolean(initialId) });
  const state = useDocumentListState();
  const { params } = state;
  const query = useDocumentsQuery(params);
  const stats = useDocumentStatsQuery();
  const [selectedId, setSelectedId] = useState<string | null>(initialId ?? null);
  const [searchText, setSearchText] = useUrlSearchInput(params.q, (q) => state.setFilters({ q }));

  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;
  const pageCount = getPageCount(query.data?.meta);
  const page = Math.min(params.page, pageCount);
  const activeFilters = activeFilterCount(params, ["page", "pageSize", "sort", "q"]);
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
    { id: "applicant", header: t("documents.columns.applicant"), enableSorting: false, accessorFn: (row) => row.applicant.name, cell: ({ row }) => <div className="flex min-w-40 items-center gap-2.5"><CustomerAvatar name={row.original.applicant.name} size="sm" className="size-8 text-[11px]" /><div className="min-w-0"><p className="truncate font-bold leading-tight">{row.original.applicant.name}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.applicant.reference}</p></div></div> },
    { id: "loan", header: t("documents.columns.loan"), enableSorting: false, accessorFn: (row) => row.loan.reference, cell: ({ row }) => <div className="whitespace-nowrap"><p className="font-semibold">{row.original.loan.reference}</p><p className="text-xs text-[var(--admin-muted)]">{loanTypeLabel(row.original.loan.loanType)}</p></div> },
    { id: "document", header: t("documents.columns.document"), enableSorting: false, accessorFn: (row) => row.type, cell: ({ row }) => <div className="flex min-w-44 items-center gap-2.5"><DocumentTypeIcon type={row.original.type} className="size-9" /><div className="min-w-0"><p className="truncate font-semibold leading-tight">{documentTypeLabel(row.original.type)}</p><p className="flex items-center gap-1 truncate text-xs text-[var(--admin-muted)]">{isPdf(row.original.mimeType) ? <FilePdfIcon size={12} aria-hidden /> : <ImageIcon size={12} aria-hidden />}<span className="max-w-36 truncate">{row.original.originalFilename}</span></p></div></div> },
    { id: "uploaded", header: t("documents.columns.uploaded"), accessorFn: (row) => row.uploadedAt, cell: ({ row }) => <span className="whitespace-nowrap text-xs">{fmtShort(row.original.uploadedAt)}</span> },
    { id: "status", header: t("documents.columns.status"), enableSorting: false, accessorFn: (row) => row.verificationStatus, cell: ({ row }) => <ReviewStatusBadge status={row.original.verificationStatus} /> },
    { id: "reviewer", header: t("documents.columns.reviewer"), enableSorting: false, accessorFn: (row) => row.reviewedBy?.name, cell: ({ row }) => <span className="whitespace-nowrap text-xs">{row.original.reviewedBy?.name ?? "—"}</span> },
  ];

  const rowActions = (doc: ReviewDocument) => (
    <Dropdown>
      <Button isIconOnly size="sm" variant="ghost" aria-label={t("documents.actionsFor", { type: documentTypeLabel(doc.type), name: doc.applicant.name })} className="size-11 min-w-11 md:size-9 md:min-w-9"><DotsThreeVerticalIcon size={20} weight="bold" /></Button>
      <Dropdown.Popover className="adminOverlay">
        <Dropdown.Menu aria-label={t("documents.actions")}>
          <Dropdown.Item id="open" textValue={t("documents.openDocument")} href={documentFileUrl(doc.fileUrl)} target="_blank" rel="noopener noreferrer"><DownloadSimpleIcon size={16} /><Label>{t("documents.openDocument")}</Label></Dropdown.Item>
          <Dropdown.Item id="review" textValue={t("documents.review")} onAction={() => review(doc)}><SealCheckIcon size={16} /><Label>{t("documents.review")}</Label></Dropdown.Item>
          <Dropdown.Item id="loan" textValue={t("documents.openLoan")} onAction={() => openLoan(doc)}><ArrowSquareOutIcon size={16} /><Label>{t("documents.openLoan")}</Label></Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );

  const filterControls = (className?: string) => (
    <>
      <AdminSelect className={className} label={t("filters.allStatuses")} value={params.status ?? all} onChange={(value) => state.setFilters({ status: value === all ? undefined : (value as VerificationStatus) })} options={[{ value: all, label: t("filters.allStatuses") }, ...verificationStatuses.map((value) => ({ value, label: verificationLabels[value] }))]} />
      <AdminSelect className={className} label={t("documents.allTypes")} value={params.type ?? all} onChange={(value) => state.setFilters({ type: value === all ? undefined : (value as DocumentType) })} options={[{ value: all, label: t("documents.allTypes") }, ...documentTypes.map((value) => ({ value, label: documentTypeLabel(value) }))]} />
      <AdminSelect className={className} label={t("documents.dates.all")} value={params.uploaded ?? all} onChange={(value) => state.setFilters({ uploaded: value === all ? undefined : (value as UploadedWindow) })} options={dateOptions.map((value) => ({ value, label: t(`documents.dates.${value}`) }))} />
    </>
  );
  const emptyText = query.isLoading ? t("documents.loading") : filtersActive ? t("documents.noMatches") : t("documents.empty");

  if (query.isError && !query.data) return <AdminPage><PageHeader title={t("pages.documents.title")} description={t("pages.documents.description")} /><AdminErrorState description={query.error instanceof ApiError ? query.error.message : undefined} onRetry={() => void query.refetch()} /></AdminPage>;

  return (
    <AdminPage>
      <PageHeader title={t("pages.documents.title")} description={t("pages.documents.description")} />
      <ul aria-label={t("documents.queue")} aria-busy={stats.isLoading} className="flex flex-wrap gap-2">
        {verificationStatuses.map((value) => <li key={value}><button type="button" onClick={() => state.setFilters({ status: params.status === value ? undefined : value })} aria-pressed={params.status === value} className="adminTile flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--admin-accent-strong)] aria-pressed:border-[var(--admin-accent-strong)] aria-pressed:bg-[var(--admin-accent-soft)]"><ReviewStatusBadge status={value} /><strong className="tabular-nums">{stats.data ? stats.data[statCount[value]] : "—"}</strong></button></li>)}
      </ul>
      <ContentSection className="overflow-visible">
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <AdminSearch className="w-auto min-w-0 max-w-none flex-1 basis-0 sm:max-w-xl" value={searchText} onChange={setSearchText} placeholder={t("pages.documents.search")} />
            <Button variant="outline" className="relative min-h-11 shrink-0 lg:hidden" onPress={filterDrawer.open} aria-label={activeFilters ? t("filters.activeCount", { count: activeFilters }) : t("filters.filters")}>
              <SlidersHorizontalIcon size={18} /><span className="max-sm:sr-only">{t("filters.filters")}</span>
              {activeFilters ? <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--admin-accent)] text-[11px] font-extrabold text-[#111820]">{activeFilters}</span> : null}
            </Button>
          </div>
          <div className="hidden flex-wrap items-center gap-2 lg:flex">
            {filterControls()}
            {filtersActive ? <Button size="sm" variant="ghost" className="min-h-10" onPress={reset}><ArrowCounterClockwiseIcon size={15} />{t("filters.resetFilters")}</Button> : null}
            <p className="ml-auto text-xs font-semibold text-[var(--admin-muted)]" aria-live="polite">{t(total === 1 ? "documents.countOne" : "documents.count", { count: total })}</p>
          </div>
        </div>
        <AdminDataTable columns={columns} data={rows} label={t("pages.documents.title")} emptyState={emptyText} pagination={{ page, pageSize: DOCUMENT_PAGE_SIZE, total, onPageChange: state.setPage }} manualSorting sorting={sorting} onSortingChange={changeSorting} loading={query.isLoading} onRowNavigate={review} rowActions={rowActions} minWidth={900} />
      </ContentSection>

      <Drawer.Backdrop isOpen={filterDrawer.isOpen} onOpenChange={filterDrawer.setOpen} className="adminOverlay">
        <Drawer.Content placement="bottom">
          <Drawer.Dialog aria-label={t("documents.filterTitle")}>
            <Drawer.Handle />
            <Drawer.Header><Drawer.Heading>{t("documents.filterTitle")}</Drawer.Heading></Drawer.Header>
            <Drawer.Body className="grid gap-3 overflow-y-auto">{filterControls("w-full")}</Drawer.Body>
            <Drawer.Footer className="grid grid-cols-2 gap-2">
              <Button variant="tertiary" className="min-h-11" isDisabled={!filtersActive} onPress={reset}>{t("filters.reset")}</Button>
              <Button variant="primary" className="min-h-11" onPress={filterDrawer.close}>{t(total === 1 ? "documents.showOne" : "documents.show", { count: total })}</Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>

      {selectedId ? <DocumentReviewDrawer documentId={selectedId} isOpen={reviewDrawer.isOpen} onOpenChange={closeReview} onOpenLoan={openLoan} /> : null}
    </AdminPage>
  );
}
