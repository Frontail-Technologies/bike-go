"use client";

import { Button, Drawer, useOverlayState } from "@heroui/react";
import { ArrowCounterClockwiseIcon, CheckCircleIcon, FileTextIcon, GridFourIcon, HourglassIcon, ListIcon, SlidersHorizontalIcon, XCircleIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";
import { AdminPagination, AdminSearch, AdminSelect, ViewToggle } from "@/components/admin/controls";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { StatCard } from "@/components/admin/data-display/stat-card";
import { AdminPage, ContentSection, PageHeader } from "@/components/admin/layout";
import { CurrencyAmount } from "@/components/admin/money";
import { AdminLoanApplicationCard } from "./admin-loan-card";
import { type Loan, fmtDateTime, isOpenForReview, loans as seed, NOW } from "./loan-data";
import { LoanStatusBadge } from "./loan-parts";
import { loanStatuses, loanStatusLabels, loanTypes } from "./loan-types";

const PAGE_SIZE = 8;
const all = "all";
type ViewMode = "table" | "cards";
const DAY = 86_400_000;
const dateOptions = [
  { value: all, label: "Any submission date" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

export function LoanList() {
  const router = useRouter();
  const filterDrawer = useOverlayState();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(all);
  const [type, setType] = useState(all);
  const [currency, setCurrency] = useState(all);
  const [dates, setDates] = useState(all);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<ViewMode>("table");

  useEffect(() => {
    const saved = window.localStorage.getItem("ridego-admin-loan-view");
    const next: ViewMode = saved === "table" || saved === "cards" ? saved : window.innerWidth < 768 ? "cards" : "table";
    startTransition(() => setView(next));
  }, []);
  function changeView(next: ViewMode) { setView(next); window.localStorage.setItem("ridego-admin-loan-view", next); }

  const filtered = useMemo(() => seed.filter((loan) => {
    const term = search.trim().toLowerCase();
    return (!term || `${loan.applicant.name} ${loan.applicant.customerReference} ${loan.reference} ${loan.applicant.phone}`.toLowerCase().includes(term))
      && (status === all || loan.status === status) && (type === all || loan.loanType === type) && (currency === all || loan.currency === currency)
      && (dates === all || NOW - Date.parse(loan.submittedAt) <= Number(dates) * DAY);
  }).sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt)), [search, status, type, currency, dates]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const activeFilters = [status, type, currency, dates].filter((value) => value !== all).length;
  const filtersActive = Boolean(search || activeFilters);
  const update = (setter: (value: string) => void) => (value: string) => { setter(value); setPage(1); };
  const reset = () => { setSearch(""); setStatus(all); setType(all); setCurrency(all); setDates(all); setPage(1); };
  const review = (loan: Loan) => router.push(`/admin/loans/${loan.reference}`);

  const stats = { total: seed.length, review: seed.filter((loan) => isOpenForReview(loan.status)).length, approved: seed.filter((loan) => loan.status === "approved").length, rejected: seed.filter((loan) => loan.status === "rejected").length };

  const columns: ColumnDef<Loan>[] = [
    { id: "applicant", header: "Applicant", accessorFn: (row) => row.applicant.name, cell: ({ row }) => <div className="flex min-w-40 items-center gap-2.5"><CustomerAvatar name={row.original.applicant.name} size="sm" /><div className="min-w-0"><p className="truncate font-bold leading-tight">{row.original.applicant.name}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.applicant.customerReference}</p></div></div> },
    { id: "application", header: "Application", accessorFn: (row) => row.reference, cell: ({ row }) => <div className="whitespace-nowrap"><p className="font-semibold">{row.original.reference}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.loanType}</p></div> },
    { id: "amount", header: "Requested", accessorFn: (row) => row.requestedMinor, cell: ({ row }) => <div><CurrencyAmount amount={row.original.requestedMinor} currency={row.original.currency} /><p className="text-[11px] text-[var(--admin-muted)]">{row.original.currency}</p></div> },
    { accessorKey: "tenureMonths", header: "Tenure", cell: ({ row }) => <span className="whitespace-nowrap">{row.original.tenureMonths} months</span> },
    { id: "employment", header: "Employment", accessorFn: (row) => row.employment.type, cell: ({ row }) => <div className="max-w-44"><p className="truncate text-sm">{row.original.employment.type}</p><p className="truncate text-xs text-[var(--admin-muted)]">{row.original.employment.employer}</p></div> },
    { accessorKey: "submittedAt", header: "Submitted", cell: ({ row }) => <span className="whitespace-nowrap text-xs">{fmtDateTime(row.original.submittedAt)}</span> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <LoanStatusBadge status={row.original.status} /> },
  ];
  const data = rows.map((loan) => ({ ...loan, id: loan.reference }));

  const filterControls = (className?: string) => (
    <>
      <AdminSelect className={className} label="All statuses" value={status} onChange={update(setStatus)} options={[{ value: all, label: "All statuses" }, ...loanStatuses.map((value) => ({ value, label: loanStatusLabels[value] }))]} />
      <AdminSelect className={className} label="All loan types" value={type} onChange={update(setType)} options={[{ value: all, label: "All loan types" }, ...loanTypes.map((value) => ({ value, label: value }))]} />
      <AdminSelect className={className} label="All currencies" value={currency} onChange={update(setCurrency)} options={[{ value: all, label: "All currencies" }, { value: "USD", label: "USD" }, { value: "KHR", label: "KHR" }]} />
      <AdminSelect className={className} label="Any submission date" value={dates} onChange={update(setDates)} options={dateOptions} />
    </>
  );
  const empty = <p className="py-12 text-center text-sm text-[var(--admin-muted)]">No loan applications match these filters.</p>;
  const pagination = <div className="border-t border-[var(--admin-border)]"><AdminPagination page={safePage} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} /></div>;

  return (
    <AdminPage>
      <PageHeader title="Loan Applications" description="Review customer loan applications, check documents and make decisions." />
      <section aria-label="Loan application summary" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard tone="info" label="Total Applications" value={stats.total} icon={<FileTextIcon size={22} weight="duotone" />} />
        <StatCard tone="warning" label="Under Review" value={stats.review} icon={<HourglassIcon size={22} weight="duotone" />} />
        <StatCard tone="success" label="Approved" value={stats.approved} icon={<CheckCircleIcon size={22} weight="duotone" />} />
        <StatCard tone="danger" label="Rejected" value={stats.rejected} icon={<XCircleIcon size={22} weight="duotone" />} />
      </section>
      <ContentSection className="overflow-visible">
        <div className="space-y-3 border-b border-[var(--admin-border)] p-4">
          <div className="flex items-center gap-2">
            <AdminSearch className="w-auto min-w-0 max-w-none flex-1 basis-0 sm:max-w-xl" value={search} onChange={update(setSearch)} placeholder="Search applicant or reference…" />
            <Button variant="outline" className="relative min-h-11 shrink-0 lg:hidden" onPress={filterDrawer.open} aria-label={`Filters${activeFilters ? `, ${activeFilters} active` : ""}`}>
              <SlidersHorizontalIcon size={18} /><span className="max-sm:sr-only">Filters</span>
              {activeFilters ? <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--admin-accent)] text-[11px] font-extrabold text-[#111820]">{activeFilters}</span> : null}
            </Button>
            <div className="ml-auto"><ViewToggle label="Loan view" value={view} onChange={changeView} options={[{ value: "table", label: "Table", icon: <ListIcon size={17} /> }, { value: "cards", label: "Cards", icon: <GridFourIcon size={17} /> }]} /></div>
          </div>
          <div className="hidden flex-wrap items-center gap-2 lg:flex">
            {filterControls()}
            {filtersActive ? <Button size="sm" variant="ghost" className="min-h-10" onPress={reset}><ArrowCounterClockwiseIcon size={15} />Reset filters</Button> : null}
            <p className="ml-auto text-xs font-semibold text-[var(--admin-muted)]" aria-live="polite">{filtered.length} application{filtered.length === 1 ? "" : "s"}</p>
          </div>
        </div>
        {view === "table" ? (
          <AdminDataTable columns={columns as ColumnDef<Loan & { id: string }>[]} data={data} label="Loan applications" emptyState="No loan applications match these filters." pagination={{ page: safePage, pageSize: PAGE_SIZE, total: filtered.length, onPageChange: setPage }} onRowNavigate={review} rowActions={(loan) => <Button size="sm" variant="outline" className="min-h-11 md:min-h-8" aria-label={`Review application ${loan.reference}`} onPress={() => review(loan)}>Review</Button>} minWidth={900} />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
              {rows.map((loan) => <AdminLoanApplicationCard key={loan.reference} loan={loan} onReview={review} />)}
              {!rows.length ? <div className="col-span-full">{empty}</div> : null}
            </div>
            {pagination}
          </>
        )}
      </ContentSection>

      <Drawer.Backdrop isOpen={filterDrawer.isOpen} onOpenChange={filterDrawer.setOpen} className="adminOverlay">
        <Drawer.Content placement="right" className="w-full max-w-md">
          <Drawer.Dialog aria-label="Filter loan applications">
            <Drawer.CloseTrigger />
            <Drawer.Header><Drawer.Heading>Filter applications</Drawer.Heading></Drawer.Header>
            <Drawer.Body className="grid gap-3">{filterControls("w-full")}</Drawer.Body>
            <Drawer.Footer className="grid grid-cols-2 gap-2">
              <Button variant="tertiary" className="min-h-11" isDisabled={!filtersActive} onPress={reset}>Reset</Button>
              <Button variant="primary" className="min-h-11" onPress={filterDrawer.close}>Show {filtered.length} application{filtered.length === 1 ? "" : "s"}</Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </AdminPage>
  );
}
