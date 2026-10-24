"use client";

import { Button } from "@heroui/react";
import { ArrowCounterClockwiseIcon, GridFourIcon, ListIcon } from "@phosphor-icons/react";
import type { ColumnDef, OnChangeFn, SortingState } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { AdminPagination, AdminSearch, ViewToggle, formatCambodiaDate } from "@/components/admin/controls";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { AdminErrorState } from "@/components/admin/feedback";
import { AdminPage, ContentSection, PageHeader } from "@/components/admin/layout";
import { ApiError } from "@/lib/api/error";
import { CUSTOMER_PAGE_SIZE, useCustomerListState } from "../hooks/use-customer-list-state";
import { useCustomersQuery } from "../hooks/use-customers";
import type { CustomerSummary } from "../types/customer";
import { AdminCustomerCard, CustomerActions } from "./admin-customer-card";

type ViewMode = "table" | "cards";

export function CustomerList() {
  const router = useRouter();
  const state = useCustomerListState();
  const { params } = state;
  const query = useCustomersQuery(params);
  const [view, setView] = useState<ViewMode>("table");
  const [searchText, setSearchText] = useState(params.q ?? "");

  useEffect(() => { const saved = window.localStorage.getItem("ridego-admin-customer-view"); if (saved === "table" || saved === "cards") startTransition(() => setView(saved)); }, []);
  // The URL is the source of truth; keep the input in step when it changes from outside (reset, back/forward).
  useEffect(() => { startTransition(() => setSearchText(params.q ?? "")); }, [params.q]);
  useEffect(() => {
    if (searchText.trim() === (params.q ?? "")) return;
    const timer = window.setTimeout(() => state.setFilters({ q: searchText.trim() || undefined }), 300);
    return () => window.clearTimeout(timer);
  }, [searchText]);
  function changeView(next: ViewMode) { setView(next); window.localStorage.setItem("ridego-admin-customer-view", next); }

  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;
  const pageCount = Math.max(1, query.data?.meta.totalPages ?? 1);
  const page = Math.min(params.page, pageCount);
  const open = (person: CustomerSummary) => router.push(`/admin/customers/${person.id}`);

  // Backend sorts: name (A–Z) and joined date (newest by default).
  const sorting: SortingState = params.sort === "name" ? [{ id: "name", desc: false }] : params.sort === "oldest" ? [{ id: "joined", desc: false }] : params.sort === "newest" ? [{ id: "joined", desc: true }] : [];
  const changeSorting: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    state.setFilters({ sort: next[0]?.id === "name" ? "name" : next[0]?.id === "joined" ? (next[0].desc ? "newest" : "oldest") : undefined });
  };

  const columns: ColumnDef<CustomerSummary>[] = [
    { id: "name", header: "Customer", accessorFn: (row) => row.name, cell: ({ row }) => <div className="flex min-w-48 items-center gap-3"><CustomerAvatar name={row.original.name} size="sm" /><div className="min-w-0"><p className="truncate font-bold leading-tight">{row.original.name}</p><p className="text-xs capitalize text-[var(--admin-muted)]">{row.original.providers.join(" · ") || "No sign-in provider"}</p></div></div> },
    { id: "contact", header: "Contact", enableSorting: false, accessorFn: (row) => row.phone, cell: ({ row }) => <div className="min-w-44"><p className="text-sm font-medium">{row.original.phone ?? "—"}</p><p className="truncate text-xs text-[var(--admin-muted)]">{row.original.email ?? "—"}</p></div> },
    { id: "city", header: "Location", enableSorting: false, accessorFn: (row) => row.city, cell: ({ row }) => row.original.city ?? "—" },
    { id: "joined", header: "Joined", accessorFn: (row) => row.createdAt, cell: ({ row }) => <span className="whitespace-nowrap">{formatCambodiaDate(row.original.createdAt)}</span> },
    { id: "bookings", header: "Bookings", enableSorting: false, accessorFn: (row) => row.bookingCount, cell: ({ row }) => <span className="font-semibold tabular-nums">{row.original.bookingCount}</span> },
    { id: "loans", header: "Loans", enableSorting: false, accessorFn: (row) => row.loanCount, cell: ({ row }) => <span className="font-semibold tabular-nums">{row.original.loanCount}</span> },
  ];

  const emptyText = query.isLoading ? "Loading customers…" : params.q ? "No customers match this search." : "No customers yet.";
  const empty = <p className="py-12 text-center text-sm text-[var(--admin-muted)]">{emptyText}</p>;

  if (query.isError && !query.data) return <AdminPage><PageHeader title="Customers" description="Manage customers, view their bookings, loan applications and account details." /><AdminErrorState title="Couldn’t load customers" description={query.error instanceof ApiError ? query.error.message : "Try again in a moment."} onRetry={() => void query.refetch()} /></AdminPage>;

  return (
    <AdminPage>
      <PageHeader title="Customers" description="Manage customers, view their bookings, loan applications and account details." />

      <ContentSection className="overflow-visible">
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--admin-border)] p-4">
          <AdminSearch className="w-auto min-w-0 max-w-none flex-1 basis-0 sm:max-w-xl" value={searchText} onChange={setSearchText} placeholder="Search customers by name, email, phone…" />
          {params.q ? <Button size="sm" variant="ghost" className="min-h-10" onPress={() => { setSearchText(""); state.reset(); }}><ArrowCounterClockwiseIcon size={15} />Clear search</Button> : null}
          <p className="hidden text-xs font-semibold text-[var(--admin-muted)] sm:block" aria-live="polite">{total} customer{total === 1 ? "" : "s"}</p>
          <div className="ml-auto"><ViewToggle label="Customer view" value={view} onChange={changeView} options={[{ value: "table", label: "Table", icon: <ListIcon size={17} /> }, { value: "cards", label: "Cards", icon: <GridFourIcon size={17} /> }]} /></div>
        </div>

        {view === "table" ? (
          <AdminDataTable columns={columns} data={rows} label="Customers" emptyState={emptyText} pagination={{ page, pageSize: CUSTOMER_PAGE_SIZE, total, onPageChange: state.setPage }} manualSorting sorting={sorting} onSortingChange={changeSorting} loading={query.isLoading} onRowNavigate={open} rowActions={(person) => <CustomerActions customer={person} onView={() => open(person)} />} minWidth={820} />
        ) : (
          <>
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3 2xl:grid-cols-4">
              {rows.map((person) => <AdminCustomerCard key={person.id} customer={person} onView={() => open(person)} />)}
              {!rows.length ? <div className="col-span-full">{empty}</div> : null}
            </div>
            <div className="border-t border-[var(--admin-border)]"><AdminPagination page={page} pageCount={pageCount} total={total} pageSize={CUSTOMER_PAGE_SIZE} onPageChange={state.setPage} /></div>
          </>
        )}
      </ContentSection>
    </AdminPage>
  );
}
