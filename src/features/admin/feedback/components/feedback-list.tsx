"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { AdminSearch, AdminSelect, formatCambodiaDate } from "@/components/admin/controls";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { AdminErrorState } from "@/components/admin/feedback";
import { AdminPage, ContentSection, PageHeader } from "@/components/admin/layout";
import { ApiError } from "@/lib/api/error";
import { FEEDBACK_PAGE_SIZE, useFeedbackListState } from "../hooks/use-feedback-list-state";
import { useFeedbackQuery } from "../hooks/use-feedback";
import { categoryLabels, ticketBadge } from "../lib/feedback-model";
import { supportTicketCategories, supportTicketStatuses, type SupportTicket, type SupportTicketCategory, type SupportTicketStatus } from "../types/feedback";

const all = "all";

export function FeedbackList() {
  const router = useRouter();
  const state = useFeedbackListState();
  const { params } = state;
  const query = useFeedbackQuery(params);
  const [searchText, setSearchText] = useState(params.q ?? "");

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
  const open = (ticket: SupportTicket) => router.push(`/admin/feedback/${ticket.reference}`);
  const filtersActive = Boolean(params.q || params.status || params.category);

  const columns: ColumnDef<SupportTicket & { id: string }>[] = [
    { id: "reference", header: "Reference", enableSorting: false, accessorFn: (row) => row.reference, cell: ({ row }) => <span className="font-bold">{row.original.reference}</span> },
    { id: "customer", header: "Customer", enableSorting: false, accessorFn: (row) => row.customer.name, cell: ({ row }) => <div className="min-w-40"><p className="truncate font-bold leading-tight">{row.original.customer.name}</p><p className="truncate text-xs text-[var(--admin-muted)]">{row.original.customer.email}</p></div> },
    { id: "category", header: "Category", enableSorting: false, accessorFn: (row) => row.category, cell: ({ row }) => categoryLabels[row.original.category] },
    { id: "booking", header: "Booking", enableSorting: false, accessorFn: (row) => row.bookingReference, cell: ({ row }) => row.original.bookingReference ?? "—" },
    { id: "submitted", header: "Submitted", accessorFn: (row) => row.createdAt, cell: ({ row }) => <span className="whitespace-nowrap">{formatCambodiaDate(row.original.createdAt)}</span> },
    { id: "status", header: "Status", enableSorting: false, accessorFn: (row) => row.status, cell: ({ row }) => { const badge = ticketBadge(row.original.status); return <AdminStatusBadge status={badge.status} label={badge.label} />; } },
  ];
  const data = rows.map((ticket) => ({ ...ticket, id: ticket.reference }));
  const emptyText = query.isLoading ? "Loading feedback…" : filtersActive ? "No reported issues match these filters." : "No reported issues yet.";

  if (query.isError && !query.data) return <AdminPage><PageHeader title="Feedback" description="Issues customers reported through the app." /><AdminErrorState title="Couldn’t load feedback" description={query.error instanceof ApiError ? query.error.message : "Try again in a moment."} onRetry={() => void query.refetch()} /></AdminPage>;

  return (
    <AdminPage>
      <PageHeader title="Feedback" description="Issues customers reported through the app." />
      <ContentSection className="overflow-visible">
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--admin-border)] p-4">
          <AdminSearch className="w-full flex-1 sm:max-w-xs" value={searchText} onChange={setSearchText} placeholder="Search reference, customer, message…" />
          <AdminSelect label="All statuses" value={params.status ?? all} onChange={(value) => state.setFilters({ status: value === all ? undefined : (value as SupportTicketStatus) })} options={[{ value: all, label: "All statuses" }, ...supportTicketStatuses.map((value) => ({ value, label: value === "open" ? "Open" : "Resolved" }))]} className="w-full sm:w-40" />
          <AdminSelect label="All categories" value={params.category ?? all} onChange={(value) => state.setFilters({ category: value === all ? undefined : (value as SupportTicketCategory) })} options={[{ value: all, label: "All categories" }, ...supportTicketCategories.map((value) => ({ value, label: categoryLabels[value] }))]} className="w-full sm:w-44" />
          <p className="ml-auto hidden text-xs font-semibold text-[var(--admin-muted)] sm:block" aria-live="polite">{total} ticket{total === 1 ? "" : "s"}</p>
        </div>
        <AdminDataTable columns={columns} data={data} label="Feedback" emptyState={emptyText} pagination={{ page, pageSize: FEEDBACK_PAGE_SIZE, total, onPageChange: state.setPage }} loading={query.isLoading} onRowNavigate={open} minWidth={860} />
      </ContentSection>
    </AdminPage>
  );
}
