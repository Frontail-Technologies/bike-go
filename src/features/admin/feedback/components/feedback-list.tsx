"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";

import { AdminSearch, AdminSelect, formatCambodiaDate } from "@/components/admin/controls";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { AdminErrorState } from "@/components/admin/feedback";
import { AdminPage, ContentSection, PageHeader } from "@/components/admin/layout";
import { ApiError } from "@/lib/api/error";
import { activeFilterCount, pageCount as getPageCount } from "@/hooks/use-list-state";
import { FEEDBACK_PAGE_SIZE, useFeedbackListState } from "../hooks/use-feedback-list-state";
import { useFeedbackQuery } from "../hooks/use-feedback";
import { categoryLabels, ticketBadge } from "../lib/feedback-model";
import { supportTicketCategories, supportTicketStatuses, type SupportTicket, type SupportTicketCategory, type SupportTicketStatus } from "../types/feedback";
import { useUrlSearchInput } from "@/hooks/use-url-search-input";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

const all = "all";

export function FeedbackList() {
  const t = useAdminTranslations();
  const router = useRouter();
  const state = useFeedbackListState();
  const { params } = state;
  const query = useFeedbackQuery(params);
  const [searchText, setSearchText] = useUrlSearchInput(params.q, (q) => state.setFilters({ q }));

  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;
  const pageCount = getPageCount(query.data?.meta);
  const page = Math.min(params.page, pageCount);
  const open = (ticket: SupportTicket) => router.push(`/admin/feedback/${ticket.reference}`);
  const filtersActive = activeFilterCount(params, ["page", "pageSize", "sort"]) > 0;

  const columns: ColumnDef<SupportTicket & { id: string }>[] = [
    { id: "reference", header: t("feedback.columns.reference"), enableSorting: false, accessorFn: (row) => row.reference, cell: ({ row }) => <span className="font-bold">{row.original.reference}</span> },
    { id: "customer", header: t("feedback.columns.customer"), enableSorting: false, accessorFn: (row) => row.customer.name, cell: ({ row }) => <div className="min-w-40"><p className="truncate font-bold leading-tight">{row.original.customer.name}</p><p className="truncate text-xs text-[var(--admin-muted)]">{row.original.customer.email}</p></div> },
    { id: "category", header: t("feedback.columns.category"), enableSorting: false, accessorFn: (row) => row.category, cell: ({ row }) => categoryLabels[row.original.category] },
    { id: "booking", header: t("feedback.columns.booking"), enableSorting: false, accessorFn: (row) => row.bookingReference, cell: ({ row }) => row.original.bookingReference ?? "—" },
    { id: "submitted", header: t("feedback.columns.submitted"), accessorFn: (row) => row.createdAt, cell: ({ row }) => <span className="whitespace-nowrap">{formatCambodiaDate(row.original.createdAt)}</span> },
    { id: "status", header: t("feedback.columns.status"), enableSorting: false, accessorFn: (row) => row.status, cell: ({ row }) => { const badge = ticketBadge(row.original.status); return <AdminStatusBadge status={badge.status} label={badge.label} />; } },
  ];
  const data = rows.map((ticket) => ({ ...ticket, id: ticket.reference }));
  const emptyText = query.isLoading ? t("feedback.loading") : filtersActive ? t("feedback.noMatches") : t("feedback.empty");

  if (query.isError && !query.data) return <AdminPage><PageHeader title={t("pages.feedback.title")} description={t("pages.feedback.description")} /><AdminErrorState title={t("feedback.loadError")} description={query.error instanceof ApiError ? query.error.message : t("common.retryLater")} onRetry={() => void query.refetch()} /></AdminPage>;

  return (
    <AdminPage>
      <PageHeader title={t("pages.feedback.title")} description={t("pages.feedback.description")} />
      <ContentSection className="overflow-visible">
        <div className="flex flex-wrap items-center gap-2 p-4">
          <AdminSearch className="w-full flex-1 sm:max-w-xs" value={searchText} onChange={setSearchText} placeholder={t("feedback.search")} />
          <AdminSelect label={t("filters.allStatuses")} value={params.status ?? all} onChange={(value) => state.setFilters({ status: value === all ? undefined : (value as SupportTicketStatus) })} options={[{ value: all, label: t("filters.allStatuses") }, ...supportTicketStatuses.map((value) => ({ value, label: t(`feedback.status.${value}`) }))]} className="w-full sm:w-40" />
          <AdminSelect label={t("feedback.allCategories")} value={params.category ?? all} onChange={(value) => state.setFilters({ category: value === all ? undefined : (value as SupportTicketCategory) })} options={[{ value: all, label: t("feedback.allCategories") }, ...supportTicketCategories.map((value) => ({ value, label: categoryLabels[value] }))]} className="w-full sm:w-44" />
          <p className="ml-auto hidden text-xs font-semibold text-[var(--admin-muted)] sm:block" aria-live="polite">{t(total === 1 ? "feedback.countOne" : "feedback.count", { count: total })}</p>
        </div>
        <AdminDataTable columns={columns} data={data} label={t("pages.feedback.title")} emptyState={emptyText} pagination={{ page, pageSize: FEEDBACK_PAGE_SIZE, total, onPageChange: state.setPage }} loading={query.isLoading} onRowNavigate={open} minWidth={860} />
      </ContentSection>
    </AdminPage>
  );
}
