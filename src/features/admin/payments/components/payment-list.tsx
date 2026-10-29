"use client";

import { Button, Drawer, useOverlayState } from "@heroui/react";
import { ArrowCounterClockwiseIcon, SlidersHorizontalIcon } from "@phosphor-icons/react";
import type { ColumnDef, OnChangeFn, SortingState } from "@tanstack/react-table";
import { useRouter } from "next/navigation";

import { PaymentStatusBadge } from "@/components/admin/bookings/booking-parts";
import { AdminSearch, AdminSelect } from "@/components/admin/controls";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { AdminErrorState } from "@/components/admin/feedback";
import { AdminPage, ContentSection, PageHeader } from "@/components/admin/layout";
import { CurrencyAmount } from "@/components/admin/money";
import { ApiError } from "@/lib/api/error";
import { PAYMENT_PAGE_SIZE, usePaymentListState } from "../hooks/use-payment-list-state";
import { usePaymentMethodsQuery, usePaymentsQuery } from "../hooks/use-payments";
import { badgeStatus, fmtShort, providerLabel, statusLabels } from "../lib/payment-model";
import { paymentStatuses, type Payment, type PaymentCurrency, type PaymentSort, type PaymentStatus, type PaymentWindow } from "../types/payment";
import { useUrlSearchInput } from "@/hooks/use-url-search-input";

const all = "all";
const dateOptions = [
  { value: all, label: "Any date" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

/** Column id → the backend's sort keys for ascending and descending. */
const sortColumns: Record<string, { asc: PaymentSort; desc: PaymentSort }> = {
  amount: { asc: "amount_asc", desc: "amount_desc" },
  created: { asc: "oldest", desc: "newest" },
};
const sortingFor = (sort: PaymentSort | undefined): SortingState => {
  const found = Object.entries(sortColumns).find(([, keys]) => keys.asc === sort || keys.desc === sort);
  return found ? [{ id: found[0], desc: found[1].desc === sort }] : [];
};

export function PaymentList() {
  const router = useRouter();
  const filterDrawer = useOverlayState();
  const state = usePaymentListState();
  const { params } = state;
  const query = usePaymentsQuery(params);
  const methods = usePaymentMethodsQuery();
  const [searchText, setSearchText] = useUrlSearchInput(params.q, (q) => state.setFilters({ q }));

  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;
  const pageCount = Math.max(1, query.data?.meta.totalPages ?? 1);
  const page = Math.min(params.page, pageCount);
  const activeFilters = [params.status, params.method, params.currency, params.window].filter(Boolean).length;
  const filtersActive = Boolean(params.q || activeFilters);
  const reset = () => { setSearchText(""); state.reset(); };
  const open = (payment: Payment) => router.push(`/admin/payments/${encodeURIComponent(payment.transactionId)}`);
  const sorting = sortingFor(params.sort);
  const changeSorting: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    const keys = next[0] ? sortColumns[next[0].id] : undefined;
    state.setFilters({ sort: keys ? (next[0]!.desc ? keys.desc : keys.asc) : undefined });
  };

  const columns: ColumnDef<Payment & { id: string }>[] = [
    { id: "payment", header: "Payment", enableSorting: false, accessorFn: (row) => row.transactionId, cell: ({ row }) => <span className="block max-w-40 truncate whitespace-nowrap font-bold" title={row.original.transactionId}>{row.original.transactionId}</span> },
    { id: "customer", header: "Customer", enableSorting: false, accessorFn: (row) => row.customer.name, cell: ({ row }) => <div className="flex min-w-36 max-w-44 items-center gap-2"><CustomerAvatar name={row.original.customer.name} size="sm" className="size-7 text-[10px]" /><div className="min-w-0"><p className="truncate font-semibold leading-tight">{row.original.customer.name}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.customer.reference}</p></div></div> },
    { id: "related", header: "Related to", enableSorting: false, accessorFn: (row) => row.booking.reference, cell: ({ row }) => <div className="whitespace-nowrap text-sm"><p>Booking {row.original.booking.reference}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.booking.vehicleName}</p></div> },
    { id: "amount", header: "Amount", accessorFn: (row) => row.amountMinor, cell: ({ row }) => <div><CurrencyAmount amount={row.original.amountMinor} currency={row.original.currency} />{row.original.refundedMinor > 0 ? <p className="text-[11px] text-[var(--admin-danger)]">−<CurrencyAmount amount={row.original.refundedMinor} currency={row.original.currency} /> refunded</p> : <p className="text-[11px] text-[var(--admin-muted)]">{row.original.currency}</p>}</div> },
    { id: "method", header: "Method", enableSorting: false, accessorFn: (row) => row.method ?? "", cell: ({ row }) => <span className="block max-w-28 truncate text-xs">{row.original.method ?? "—"}</span> },
    { id: "provider", header: "Provider", enableSorting: false, accessorFn: (row) => row.provider, cell: ({ row }) => <span className="block max-w-32 truncate text-xs">{providerLabel(row.original.provider)}</span> },
    { id: "status", header: "Status", enableSorting: false, accessorFn: (row) => row.status, cell: ({ row }) => <PaymentStatusBadge status={badgeStatus(row.original)} /> },
    { id: "created", header: "Date / time", accessorFn: (row) => row.createdAt, cell: ({ row }) => <span className="whitespace-nowrap text-xs">{fmtShort(row.original.createdAt)}</span> },
  ];
  const data = rows.map((payment) => ({ ...payment, id: payment.transactionId }));

  const filterControls = (className?: string) => (
    <>
      <AdminSelect className={className} label="All statuses" value={params.status ?? all} onChange={(value) => state.setFilters({ status: value === all ? undefined : (value as PaymentStatus) })} options={[{ value: all, label: "All statuses" }, ...paymentStatuses.map((value) => ({ value, label: statusLabels[value] }))]} />
      <AdminSelect className={className} label="All methods" value={params.method ?? all} onChange={(value) => state.setFilters({ method: value === all ? undefined : value })} options={[{ value: all, label: "All methods" }, ...(methods.data ?? []).map((value) => ({ value, label: value }))]} />
      <AdminSelect className={className} label="All currencies" value={params.currency ?? all} onChange={(value) => state.setFilters({ currency: value === all ? undefined : (value as PaymentCurrency) })} options={[{ value: all, label: "All currencies" }, { value: "USD", label: "USD" }, { value: "KHR", label: "KHR" }]} />
      <AdminSelect className={className} label="Any date" value={params.window ?? all} onChange={(value) => state.setFilters({ window: value === all ? undefined : (value as PaymentWindow) })} options={dateOptions} />
    </>
  );
  const emptyText = query.isLoading ? "Loading payments…" : filtersActive ? "No payments match these filters." : "No payments yet.";

  if (query.isError && !query.data) return <AdminPage><PageHeader title="Payments" description="View payment attempts for bookings and follow each one to its booking and customer." /><AdminErrorState title="Couldn’t load payments" description={query.error instanceof ApiError ? query.error.message : "Try again in a moment."} onRetry={() => void query.refetch()} /></AdminPage>;

  return (
    <AdminPage>
      <PageHeader title="Payments" description="View payment attempts for bookings and follow each one to its booking and customer." />
      <ContentSection className="overflow-visible">
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <AdminSearch className="w-auto min-w-0 max-w-none flex-1 basis-0 sm:max-w-xl" value={searchText} onChange={setSearchText} placeholder="Search payment, customer or booking…" />
            <Button variant="outline" className="relative min-h-11 shrink-0 lg:hidden" onPress={filterDrawer.open} aria-label={`Filters${activeFilters ? `, ${activeFilters} active` : ""}`}>
              <SlidersHorizontalIcon size={18} /><span className="max-sm:sr-only">Filters</span>
              {activeFilters ? <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--admin-accent)] text-[11px] font-extrabold text-[#111820]">{activeFilters}</span> : null}
            </Button>
          </div>
          <div className="hidden flex-wrap items-center gap-2 lg:flex">
            {filterControls()}
            {filtersActive ? <Button size="sm" variant="ghost" className="min-h-10" onPress={reset}><ArrowCounterClockwiseIcon size={15} />Reset filters</Button> : null}
            <p className="ml-auto text-xs font-semibold text-[var(--admin-muted)]" aria-live="polite">{total} payment{total === 1 ? "" : "s"}</p>
          </div>
        </div>
        <AdminDataTable columns={columns} data={data} label="Payments" emptyState={emptyText} pagination={{ page, pageSize: PAYMENT_PAGE_SIZE, total, onPageChange: state.setPage }} manualSorting sorting={sorting} onSortingChange={changeSorting} loading={query.isLoading} onRowNavigate={open} minWidth={900} />
      </ContentSection>

      <Drawer.Backdrop isOpen={filterDrawer.isOpen} onOpenChange={filterDrawer.setOpen} className="adminOverlay">
        <Drawer.Content placement="bottom">
          <Drawer.Dialog aria-label="Filter payments">
            <Drawer.Handle />
            <Drawer.Header><Drawer.Heading>Filter payments</Drawer.Heading></Drawer.Header>
            <Drawer.Body className="grid gap-3 overflow-y-auto">{filterControls("w-full")}</Drawer.Body>
            <Drawer.Footer className="grid grid-cols-2 gap-2">
              <Button variant="tertiary" className="min-h-11" isDisabled={!filtersActive} onPress={reset}>Reset</Button>
              <Button variant="primary" className="min-h-11" onPress={filterDrawer.close}>Show {total} payment{total === 1 ? "" : "s"}</Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </AdminPage>
  );
}
