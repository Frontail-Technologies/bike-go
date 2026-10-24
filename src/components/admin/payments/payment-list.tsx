"use client";

import { Button, Drawer, useOverlayState } from "@heroui/react";
import { ArrowCounterClockwiseIcon, GridFourIcon, ListIcon, SlidersHorizontalIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";
import { paymentLabels, paymentStatuses } from "@/components/admin/payments/payment-booking-mock";
import { AdminPagination, AdminSearch, AdminSelect, ViewToggle } from "@/components/admin/controls";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { AdminPage, ContentSection, PageHeader } from "@/components/admin/layout";
import { CurrencyAmount } from "@/components/admin/money";
import { AdminPaymentCard } from "./admin-payment-card";
import { type Payment, fmtShort, NOW, payments as seed, paymentTypes, typeLabels } from "./payment-data";
import { PaymentStatusBadge, PaymentTypeBadge } from "./payment-parts";

const PAGE_SIZE = 8;
const all = "all";
type ViewMode = "table" | "cards";
const DAY = 86_400_000;
const dateOptions = [
  { value: all, label: "Any date" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

export function PaymentList() {
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
    const saved = window.localStorage.getItem("ridego-admin-payment-view");
    const next: ViewMode = saved === "table" || saved === "cards" ? saved : window.innerWidth < 768 ? "cards" : "table";
    startTransition(() => setView(next));
  }, []);
  function changeView(next: ViewMode) { setView(next); window.localStorage.setItem("ridego-admin-payment-view", next); }

  const filtered = useMemo(() => seed.filter((payment) => {
    const term = search.trim().toLowerCase();
    return (!term || `${payment.reference} ${payment.customer.name} ${payment.customer.reference} ${payment.relatedReference}`.toLowerCase().includes(term))
      && (status === all || payment.status === status) && (type === all || payment.type === type) && (currency === all || payment.currency === currency)
      && (dates === all || NOW - Date.parse(payment.createdAt) <= Number(dates) * DAY);
  }), [search, status, type, currency, dates]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const activeFilters = [status, type, currency, dates].filter((value) => value !== all).length;
  const filtersActive = Boolean(search || activeFilters);
  const update = (setter: (value: string) => void) => (value: string) => { setter(value); setPage(1); };
  const reset = () => { setSearch(""); setStatus(all); setType(all); setCurrency(all); setDates(all); setPage(1); };
  const open = (payment: Payment) => router.push(`/admin/payments/${payment.reference}`);

  const columns: ColumnDef<Payment>[] = [
    { accessorKey: "reference", header: "Payment", cell: ({ row }) => <span className="whitespace-nowrap font-bold">{row.original.reference}</span> },
    { id: "customer", header: "Customer", accessorFn: (row) => row.customer.name, cell: ({ row }) => <div className="flex min-w-36 max-w-44 items-center gap-2"><CustomerAvatar name={row.original.customer.name} size="sm" className="size-7 text-[10px]" /><div className="min-w-0"><p className="truncate font-semibold leading-tight">{row.original.customer.name}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.customer.reference}</p></div></div> },
    { accessorKey: "type", header: "Type", cell: ({ row }) => <PaymentTypeBadge type={row.original.type} /> },
    { accessorKey: "relatedReference", header: "Related to", cell: ({ row }) => <span className="whitespace-nowrap text-sm">{row.original.relatedReference}</span> },
    { id: "amount", header: "Amount", accessorFn: (row) => row.amount, cell: ({ row }) => <div><CurrencyAmount amount={row.original.amount} currency={row.original.currency} /><p className="text-[11px] text-[var(--admin-muted)]">{row.original.currency}</p></div> },
    { id: "method", header: "Method", accessorFn: (row) => row.method ?? "", cell: ({ row }) => <span className="block max-w-32 truncate text-xs">{row.original.method ?? "—"}</span> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <PaymentStatusBadge status={row.original.status} /> },
    { accessorKey: "createdAt", header: "Date / time", cell: ({ row }) => <span className="whitespace-nowrap text-xs">{fmtShort(row.original.createdAt)}</span> },
  ];
  const data = rows.map((payment) => ({ ...payment, id: payment.reference }));

  const filterControls = (className?: string) => (
    <>
      <AdminSelect className={className} label="All statuses" value={status} onChange={update(setStatus)} options={[{ value: all, label: "All statuses" }, ...paymentStatuses.map((value) => ({ value, label: paymentLabels[value] }))]} />
      <AdminSelect className={className} label="All types" value={type} onChange={update(setType)} options={[{ value: all, label: "All types" }, ...paymentTypes.map((value) => ({ value, label: typeLabels[value] }))]} />
      <AdminSelect className={className} label="All currencies" value={currency} onChange={update(setCurrency)} options={[{ value: all, label: "All currencies" }, { value: "USD", label: "USD" }, { value: "KHR", label: "KHR" }]} />
      <AdminSelect className={className} label="Any date" value={dates} onChange={update(setDates)} options={dateOptions} />
    </>
  );
  const empty = <p className="py-12 text-center text-sm text-[var(--admin-muted)]">No payments match these filters.</p>;
  const pagination = <div className="border-t border-[var(--admin-border)]"><AdminPagination page={safePage} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} /></div>;

  return (
    <AdminPage>
      <PageHeader title="Payments" description="View payment records for bookings and loans, and follow each one to its source." />
      <ContentSection className="overflow-visible">
        <div className="space-y-3 border-b border-[var(--admin-border)] p-4">
          <div className="flex items-center gap-2">
            <AdminSearch className="w-auto min-w-0 max-w-none flex-1 basis-0 sm:max-w-xl" value={search} onChange={update(setSearch)} placeholder="Search payment, customer, booking or loan…" />
            <Button variant="outline" className="relative min-h-11 shrink-0 lg:hidden" onPress={filterDrawer.open} aria-label={`Filters${activeFilters ? `, ${activeFilters} active` : ""}`}>
              <SlidersHorizontalIcon size={18} /><span className="max-sm:sr-only">Filters</span>
              {activeFilters ? <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--admin-accent)] text-[11px] font-extrabold text-[#111820]">{activeFilters}</span> : null}
            </Button>
            <div className="ml-auto"><ViewToggle label="Payment view" value={view} onChange={changeView} options={[{ value: "table", label: "Table", icon: <ListIcon size={17} /> }, { value: "cards", label: "Cards", icon: <GridFourIcon size={17} /> }]} /></div>
          </div>
          <div className="hidden flex-wrap items-center gap-2 lg:flex">
            {filterControls()}
            {filtersActive ? <Button size="sm" variant="ghost" className="min-h-10" onPress={reset}><ArrowCounterClockwiseIcon size={15} />Reset filters</Button> : null}
            <p className="ml-auto text-xs font-semibold text-[var(--admin-muted)]" aria-live="polite">{filtered.length} payment{filtered.length === 1 ? "" : "s"}</p>
          </div>
        </div>
        {view === "table" ? (
          <AdminDataTable columns={columns as ColumnDef<Payment & { id: string }>[]} data={data} label="Payments" emptyState="No payments match these filters." pagination={{ page: safePage, pageSize: PAGE_SIZE, total: filtered.length, onPageChange: setPage }} onRowNavigate={open} rowActions={(payment) => <Button size="sm" variant="outline" className="min-h-11 md:min-h-8" aria-label={`View details for ${payment.reference}`} onPress={() => open(payment)}>View</Button>} minWidth={900} />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
              {rows.map((payment) => <AdminPaymentCard key={payment.reference} payment={payment} onView={open} />)}
              {!rows.length ? <div className="col-span-full">{empty}</div> : null}
            </div>
            {pagination}
          </>
        )}
      </ContentSection>

      <Drawer.Backdrop isOpen={filterDrawer.isOpen} onOpenChange={filterDrawer.setOpen} className="adminOverlay">
        <Drawer.Content placement="right" className="w-full max-w-md">
          <Drawer.Dialog aria-label="Filter payments">
            <Drawer.CloseTrigger />
            <Drawer.Header><Drawer.Heading>Filter payments</Drawer.Heading></Drawer.Header>
            <Drawer.Body className="grid gap-3">{filterControls("w-full")}</Drawer.Body>
            <Drawer.Footer className="grid grid-cols-2 gap-2">
              <Button variant="tertiary" className="min-h-11" isDisabled={!filtersActive} onPress={reset}>Reset</Button>
              <Button variant="primary" className="min-h-11" onPress={filterDrawer.close}>Show {filtered.length} payment{filtered.length === 1 ? "" : "s"}</Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </AdminPage>
  );
}
