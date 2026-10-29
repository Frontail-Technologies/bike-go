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
import { activeFilterCount, pageCount as getPageCount } from "@/hooks/use-list-state";
import { PAYMENT_PAGE_SIZE, usePaymentListState } from "../hooks/use-payment-list-state";
import { usePaymentMethodsQuery, usePaymentsQuery } from "../hooks/use-payments";
import { badgeStatus, fmtShort, providerLabel, statusLabels } from "../lib/payment-model";
import { paymentStatuses, type Payment, type PaymentCurrency, type PaymentSort, type PaymentStatus, type PaymentWindow } from "../types/payment";
import { useUrlSearchInput } from "@/hooks/use-url-search-input";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

const all = "all";
const dateOptions = [all, "7", "30", "90"] as const;

const sortColumns: Record<string, { asc: PaymentSort; desc: PaymentSort }> = {
  amount: { asc: "amount_asc", desc: "amount_desc" },
  created: { asc: "oldest", desc: "newest" },
};
const sortingFor = (sort: PaymentSort | undefined): SortingState => {
  const found = Object.entries(sortColumns).find(([, keys]) => keys.asc === sort || keys.desc === sort);
  return found ? [{ id: found[0], desc: found[1].desc === sort }] : [];
};

export function PaymentList() {
  const t = useAdminTranslations();
  const router = useRouter();
  const filterDrawer = useOverlayState();
  const state = usePaymentListState();
  const { params } = state;
  const query = usePaymentsQuery(params);
  const methods = usePaymentMethodsQuery();
  const [searchText, setSearchText] = useUrlSearchInput(params.q, (q) => state.setFilters({ q }));

  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;
  const pageCount = getPageCount(query.data?.meta);
  const page = Math.min(params.page, pageCount);
  const activeFilters = activeFilterCount(params, ["page", "pageSize", "sort", "q", "currency"]);
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
    { id: "payment", header: t("payments.columns.payment"), enableSorting: false, accessorFn: (row) => row.transactionId, cell: ({ row }) => <span className="block max-w-40 truncate whitespace-nowrap font-bold" title={row.original.transactionId}>{row.original.transactionId}</span> },
    { id: "customer", header: t("payments.columns.customer"), enableSorting: false, accessorFn: (row) => row.customer.name, cell: ({ row }) => <div className="flex min-w-36 max-w-44 items-center gap-2"><CustomerAvatar name={row.original.customer.name} size="sm" className="size-7 text-[10px]" /><div className="min-w-0"><p className="truncate font-semibold leading-tight">{row.original.customer.name}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.customer.reference}</p></div></div> },
    { id: "related", header: t("payments.columns.related"), enableSorting: false, accessorFn: (row) => row.booking.reference, cell: ({ row }) => <div className="whitespace-nowrap text-sm"><p>{t("payments.booking", { reference: row.original.booking.reference })}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.booking.vehicleName}</p></div> },
    { id: "amount", header: t("payments.columns.amount"), accessorFn: (row) => row.amountMinor, cell: ({ row }) => <div><CurrencyAmount amount={row.original.amountMinor} currency={row.original.currency} />{row.original.refundedMinor > 0 ? <p className="text-[11px] text-[var(--admin-danger)]">−<CurrencyAmount amount={row.original.refundedMinor} currency={row.original.currency} />{t("payments.refunded")}</p> : <p className="text-[11px] text-[var(--admin-muted)]">{row.original.currency}</p>}</div> },
    { id: "method", header: t("payments.columns.method"), enableSorting: false, accessorFn: (row) => row.method ?? "", cell: ({ row }) => <span className="block max-w-28 truncate text-xs">{row.original.method ?? "—"}</span> },
    { id: "provider", header: t("payments.columns.provider"), enableSorting: false, accessorFn: (row) => row.provider, cell: ({ row }) => <span className="block max-w-32 truncate text-xs">{providerLabel(row.original.provider)}</span> },
    { id: "status", header: t("payments.columns.status"), enableSorting: false, accessorFn: (row) => row.status, cell: ({ row }) => <PaymentStatusBadge status={badgeStatus(row.original)} /> },
    { id: "created", header: t("payments.columns.created"), accessorFn: (row) => row.createdAt, cell: ({ row }) => <span className="whitespace-nowrap text-xs">{fmtShort(row.original.createdAt)}</span> },
  ];
  const data = rows.map((payment) => ({ ...payment, id: payment.transactionId }));

  const filterControls = (className?: string) => (
    <>
      <AdminSelect className={className} label={t("filters.allStatuses")} value={params.status ?? all} onChange={(value) => state.setFilters({ status: value === all ? undefined : (value as PaymentStatus) })} options={[{ value: all, label: t("filters.allStatuses") }, ...paymentStatuses.map((value) => ({ value, label: statusLabels[value] }))]} />
      <AdminSelect className={className} label={t("payments.allMethods")} value={params.method ?? all} onChange={(value) => state.setFilters({ method: value === all ? undefined : value })} options={[{ value: all, label: t("payments.allMethods") }, ...(methods.data ?? []).map((value) => ({ value, label: value }))]} />
      <AdminSelect className={className} label={t("payments.allCurrencies")} value={params.currency ?? all} onChange={(value) => state.setFilters({ currency: value === all ? undefined : (value as PaymentCurrency) })} options={[{ value: all, label: t("payments.allCurrencies") }, { value: "USD", label: "USD" }, { value: "KHR", label: "KHR" }]} />
      <AdminSelect className={className} label={t("payments.dates.all")} value={params.window ?? all} onChange={(value) => state.setFilters({ window: value === all ? undefined : (value as PaymentWindow) })} options={dateOptions.map((value) => ({ value, label: t(`payments.dates.${value}`) }))} />
    </>
  );
  const emptyText = query.isLoading ? t("payments.loading") : filtersActive ? t("payments.noMatches") : t("payments.empty");

  if (query.isError && !query.data) return <AdminPage><PageHeader title={t("pages.payments.title")} description={t("payments.description")} /><AdminErrorState title={t("payments.loadError")} description={query.error instanceof ApiError ? query.error.message : t("common.retryLater")} onRetry={() => void query.refetch()} /></AdminPage>;

  return (
    <AdminPage>
      <PageHeader title={t("pages.payments.title")} description={t("payments.description")} />
      <ContentSection className="overflow-visible">
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <AdminSearch className="w-auto min-w-0 max-w-none flex-1 basis-0 sm:max-w-xl" value={searchText} onChange={setSearchText} placeholder={t("payments.search")} />
            <Button variant="outline" className="relative min-h-11 shrink-0 lg:hidden" onPress={filterDrawer.open} aria-label={activeFilters ? t("filters.activeCount", { count: activeFilters }) : t("filters.filters")}>
              <SlidersHorizontalIcon size={18} /><span className="max-sm:sr-only">{t("filters.filters")}</span>
              {activeFilters ? <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--admin-accent)] text-[11px] font-extrabold text-[#111820]">{activeFilters}</span> : null}
            </Button>
          </div>
          <div className="hidden flex-wrap items-center gap-2 lg:flex">
            {filterControls()}
            {filtersActive ? <Button size="sm" variant="ghost" className="min-h-10" onPress={reset}><ArrowCounterClockwiseIcon size={15} />{t("filters.resetFilters")}</Button> : null}
            <p className="ml-auto text-xs font-semibold text-[var(--admin-muted)]" aria-live="polite">{t(total === 1 ? "payments.countOne" : "payments.count", { count: total })}</p>
          </div>
        </div>
        <AdminDataTable columns={columns} data={data} label={t("pages.payments.title")} emptyState={emptyText} pagination={{ page, pageSize: PAYMENT_PAGE_SIZE, total, onPageChange: state.setPage }} manualSorting sorting={sorting} onSortingChange={changeSorting} loading={query.isLoading} onRowNavigate={open} minWidth={900} />
      </ContentSection>

      <Drawer.Backdrop isOpen={filterDrawer.isOpen} onOpenChange={filterDrawer.setOpen} className="adminOverlay">
        <Drawer.Content placement="bottom">
          <Drawer.Dialog aria-label={t("payments.filterTitle")}>
            <Drawer.Handle />
            <Drawer.Header><Drawer.Heading>{t("payments.filterTitle")}</Drawer.Heading></Drawer.Header>
            <Drawer.Body className="grid gap-3 overflow-y-auto">{filterControls("w-full")}</Drawer.Body>
            <Drawer.Footer className="grid grid-cols-2 gap-2">
              <Button variant="tertiary" className="min-h-11" isDisabled={!filtersActive} onPress={reset}>{t("filters.reset")}</Button>
              <Button variant="primary" className="min-h-11" onPress={filterDrawer.close}>{t(total === 1 ? "payments.showOne" : "payments.show", { count: total })}</Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </AdminPage>
  );
}
