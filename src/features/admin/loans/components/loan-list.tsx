"use client";

import { Button, Drawer, useOverlayState } from "@heroui/react";
import { ArrowCounterClockwiseIcon, CheckCircleIcon, FileTextIcon, HourglassIcon, SlidersHorizontalIcon, XCircleIcon } from "@phosphor-icons/react";
import type { ColumnDef, OnChangeFn, SortingState } from "@tanstack/react-table";
import { useRouter } from "next/navigation";

import { AdminSearch, AdminSelect } from "@/components/admin/controls";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { StatCard } from "@/components/admin/data-display/stat-card";
import { AdminErrorState } from "@/components/admin/feedback";
import { AdminPage, ContentSection, PageHeader } from "@/components/admin/layout";
import { LoanStatusBadge } from "@/components/admin/loans/loan-parts";
import { CurrencyAmount } from "@/components/admin/money";
import { ApiError } from "@/lib/api/error";
import { activeFilterCount, pageCount as getPageCount } from "@/hooks/use-list-state";
import { LOAN_PAGE_SIZE, useLoanListState } from "../hooks/use-loan-list-state";
import { useLoansQuery, useLoanStatsQuery } from "../hooks/use-loans";
import { employmentLabels, loanStatusLabels, loanTypeLabel } from "../lib/loan-model";
import { loanStatuses, loanTypes, type Loan, type LoanCurrency, type LoanSort, type LoanStatus, type LoanType, type SubmittedWindow } from "../types/loan";
import { fmtDateTime } from "./loan-format";
import { useUrlSearchInput } from "@/hooks/use-url-search-input";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

const all = "all";
const dateOptions = [all, "7", "30", "90"] as const;

const sortColumns: Record<string, { asc: LoanSort; desc: LoanSort }> = {
  submitted: { asc: "oldest", desc: "newest" },
  amount: { asc: "amount_asc", desc: "amount_desc" },
};
const sortingFor = (sort: LoanSort | undefined): SortingState => {
  const found = Object.entries(sortColumns).find(([, keys]) => keys.asc === sort || keys.desc === sort);
  return found ? [{ id: found[0], desc: found[1].desc === sort }] : [];
};

export function LoanList() {
  const t = useAdminTranslations();
  const router = useRouter();
  const filterDrawer = useOverlayState();
  const state = useLoanListState();
  const { params } = state;
  const query = useLoansQuery(params);
  const stats = useLoanStatsQuery();
  const [searchText, setSearchText] = useUrlSearchInput(params.q, (q) => state.setFilters({ q }));

  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;
  const pageCount = getPageCount(query.data?.meta);
  const page = Math.min(params.page, pageCount);
  const activeFilters = activeFilterCount(params, ["page", "pageSize", "sort", "q", "currency"]);
  const filtersActive = Boolean(params.q || activeFilters);
  const reset = () => { setSearchText(""); state.reset(); };
  const review = (loan: Loan) => router.push(`/admin/loans/${loan.reference}`);
  const sorting = sortingFor(params.sort);
  const changeSorting: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    const keys = next[0] ? sortColumns[next[0].id] : undefined;
    state.setFilters({ sort: keys ? (next[0]!.desc ? keys.desc : keys.asc) : undefined });
  };

  const columns: ColumnDef<Loan & { id: string }>[] = [
    { id: "applicant", header: t("loans.columns.applicant"), enableSorting: false, accessorFn: (row) => row.customer.name, cell: ({ row }) => <div className="flex min-w-40 items-center gap-2.5"><CustomerAvatar name={row.original.customer.name} size="sm" /><div className="min-w-0"><p className="truncate font-bold leading-tight">{row.original.customer.name}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.customer.reference}</p></div></div> },
    { id: "application", header: t("loans.columns.application"), enableSorting: false, accessorFn: (row) => row.reference, cell: ({ row }) => <div className="whitespace-nowrap"><p className="font-semibold">{row.original.reference}</p><p className="text-xs text-[var(--admin-muted)]">{loanTypeLabel(row.original.loanType)}</p></div> },
    { id: "amount", header: t("loans.columns.requested"), accessorFn: (row) => row.requestedAmountMinor, cell: ({ row }) => <div><CurrencyAmount amount={row.original.requestedAmountMinor} currency={row.original.currency} /><p className="text-[11px] text-[var(--admin-muted)]">{row.original.currency}</p></div> },
    { id: "tenure", header: t("loans.columns.tenure"), enableSorting: false, accessorFn: (row) => row.tenureMonths, cell: ({ row }) => <span className="whitespace-nowrap">{t("loans.months", { count: row.original.tenureMonths })}</span> },
    { id: "employment", header: t("loans.columns.employment"), enableSorting: false, accessorFn: (row) => row.employment.employmentType, cell: ({ row }) => <div className="max-w-44"><p className="truncate text-sm">{row.original.employment.employmentType ? employmentLabels[row.original.employment.employmentType] ?? row.original.employment.employmentType : "—"}</p><p className="truncate text-xs text-[var(--admin-muted)]">{row.original.employment.employerName ?? ""}</p></div> },
    { id: "submitted", header: t("loans.columns.submitted"), accessorFn: (row) => row.submittedAt ?? row.createdAt, cell: ({ row }) => <span className="whitespace-nowrap text-xs">{row.original.submittedAt ? fmtDateTime(row.original.submittedAt) : t("loans.notSubmitted")}</span> },
    { id: "status", header: t("loans.columns.status"), enableSorting: false, accessorFn: (row) => row.status, cell: ({ row }) => <LoanStatusBadge status={row.original.status} /> },
  ];
  const data = rows.map((loan) => ({ ...loan, id: loan.reference }));

  const filterControls = (className?: string) => (
    <>
      <AdminSelect className={className} label={t("filters.allStatuses")} value={params.status ?? all} onChange={(value) => state.setFilters({ status: value === all ? undefined : (value as LoanStatus) })} options={[{ value: all, label: t("filters.allStatuses") }, ...loanStatuses.map((value) => ({ value, label: loanStatusLabels[value] }))]} />
      <AdminSelect className={className} label={t("loans.allTypes")} value={params.loanType ?? all} onChange={(value) => state.setFilters({ loanType: value === all ? undefined : (value as LoanType) })} options={[{ value: all, label: t("loans.allTypes") }, ...loanTypes.map((value) => ({ value, label: loanTypeLabel(value) }))]} />
      <AdminSelect className={className} label={t("loans.allCurrencies")} value={params.currency ?? all} onChange={(value) => state.setFilters({ currency: value === all ? undefined : (value as LoanCurrency) })} options={[{ value: all, label: t("loans.allCurrencies") }, { value: "USD", label: "USD" }, { value: "KHR", label: "KHR" }]} />
      <AdminSelect className={className} label={t("loans.dates.any")} value={params.submitted ?? all} onChange={(value) => state.setFilters({ submitted: value === all ? undefined : (value as SubmittedWindow) })} options={dateOptions.map((value) => ({ value, label: t(`loans.dates.${value === all ? "any" : value}`) }))} />
    </>
  );
  const emptyText = query.isLoading ? t("loans.loading") : filtersActive ? t("loans.noMatches") : t("loans.empty");
  const summary = stats.data;

  if (query.isError && !query.data) return <AdminPage><PageHeader title={t("pages.loans.title")} description={t("loans.description")} /><AdminErrorState title={t("loans.loadError")} description={query.error instanceof ApiError ? query.error.message : t("common.retryLater")} onRetry={() => void query.refetch()} /></AdminPage>;

  return (
    <AdminPage>
      <PageHeader title={t("pages.loans.title")} description={t("loans.description")} />
      <section aria-label={t("loans.summary")} aria-busy={stats.isLoading} className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard loading={stats.isLoading} tone="purple" label={t("loans.stats.total")} value={summary?.total ?? 0} icon={<FileTextIcon size={22} weight="duotone" />} />
        <StatCard loading={stats.isLoading} tone="warning" label={t("loans.stats.underReview")} value={summary?.underReview ?? 0} icon={<HourglassIcon size={22} weight="duotone" />} />
        <StatCard loading={stats.isLoading} tone="success" label={t("loans.stats.approved")} value={summary?.approved ?? 0} icon={<CheckCircleIcon size={22} weight="duotone" />} />
        <StatCard loading={stats.isLoading} tone="danger" label={t("loans.stats.rejected")} value={summary?.rejected ?? 0} icon={<XCircleIcon size={22} weight="duotone" />} />
      </section>
      <ContentSection className="overflow-visible">
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <AdminSearch className="w-auto min-w-0 max-w-none flex-1 basis-0 sm:max-w-xl" value={searchText} onChange={setSearchText} placeholder={t("pages.loans.search")} />
            <Button variant="outline" className="relative min-h-11 shrink-0 lg:hidden" onPress={filterDrawer.open} aria-label={activeFilters ? t("filters.activeCount", { count: activeFilters }) : t("filters.filters")}>
              <SlidersHorizontalIcon size={18} /><span className="max-sm:sr-only">{t("filters.filters")}</span>
              {activeFilters ? <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--admin-accent)] text-[11px] font-extrabold text-[#111820]">{activeFilters}</span> : null}
            </Button>
          </div>
          <div className="hidden flex-wrap items-center gap-2 lg:flex">
            {filterControls()}
            {filtersActive ? <Button size="sm" variant="ghost" className="min-h-10" onPress={reset}><ArrowCounterClockwiseIcon size={15} />{t("filters.resetFilters")}</Button> : null}
            <p className="ml-auto text-xs font-semibold text-[var(--admin-muted)]" aria-live="polite">{t(total === 1 ? "loans.countOne" : "loans.count", { count: total })}</p>
          </div>
        </div>
        <AdminDataTable columns={columns} data={data} label={t("loans.label")} emptyState={emptyText} pagination={{ page, pageSize: LOAN_PAGE_SIZE, total, onPageChange: state.setPage }} manualSorting sorting={sorting} onSortingChange={changeSorting} loading={query.isLoading} onRowNavigate={review} rowActions={(loan) => <Button size="sm" variant="outline" className="min-h-11 md:min-h-8" aria-label={t("loans.reviewAria", { reference: loan.reference })} onPress={() => review(loan)}>{t("loans.review")}</Button>} minWidth={900} />
      </ContentSection>

      <Drawer.Backdrop isOpen={filterDrawer.isOpen} onOpenChange={filterDrawer.setOpen} className="adminOverlay">
        <Drawer.Content placement="bottom">
          <Drawer.Dialog aria-label={t("loans.filterAria")}>
            <Drawer.Handle />
            <Drawer.Header><Drawer.Heading>{t("loans.filterTitle")}</Drawer.Heading></Drawer.Header>
            <Drawer.Body className="grid gap-3 overflow-y-auto">{filterControls("w-full")}</Drawer.Body>
            <Drawer.Footer className="grid grid-cols-2 gap-2">
              <Button variant="tertiary" className="min-h-11" isDisabled={!filtersActive} onPress={reset}>{t("filters.reset")}</Button>
              <Button variant="primary" className="min-h-11" onPress={filterDrawer.close}>{t(total === 1 ? "loans.showOne" : "loans.show", { count: total })}</Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </AdminPage>
  );
}
