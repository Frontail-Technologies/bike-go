"use client";

import { Button, Drawer, useOverlayState } from "@heroui/react";
import { ArrowCounterClockwiseIcon, CalendarCheckIcon, CarProfileIcon, SlidersHorizontalIcon, UserPlusIcon, UsersIcon } from "@phosphor-icons/react";
import type { ColumnDef, OnChangeFn, SortingState } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminSearch, AdminSelect, formatCambodiaDate } from "@/components/admin/controls";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { StatCard } from "@/components/admin/data-display/stat-card";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { AdminErrorState } from "@/components/admin/feedback";
import { AdminPage, ContentSection, PageHeader } from "@/components/admin/layout";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/error";
import { activeFilterCount, pageCount as getPageCount } from "@/hooks/use-list-state";
import { CUSTOMER_PAGE_SIZE, useCustomerListState } from "../hooks/use-customer-list-state";
import { useCustomerLoader, useCustomerStatsQuery, useCustomersQuery } from "../hooks/use-customers";
import type { Customer, CustomerStatus, CustomerSummary, JoinedWindow } from "../types/customer";
import { CustomerActions } from "./admin-customer-card";
import { CustomerEditDrawer } from "./customer-edit-drawer";
import { useUrlSearchInput } from "@/hooks/use-url-search-input";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

const all = "all";

const joinedOptions = [all, "30", "90", "180"] as const;

export function CustomerList() {
  const t = useAdminTranslations();
  const router = useRouter();
  const filterDrawer = useOverlayState();
  const editDrawer = useOverlayState();
  const state = useCustomerListState();
  const { params } = state;
  const query = useCustomersQuery(params);
  const stats = useCustomerStatsQuery();
  const loadCustomer = useCustomerLoader();
  const [searchText, setSearchText] = useUrlSearchInput(params.q, (q) => state.setFilters({ q }));
  const [editing, setEditing] = useState<Customer | null>(null);

  const rows = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;
  const pageCount = getPageCount(query.data?.meta);
  const page = Math.min(params.page, pageCount);
  const open = (person: CustomerSummary) => router.push(`/admin/customers/${person.id}`);
  const activeFilters = activeFilterCount(params, ["page", "pageSize", "sort", "q"]);
  const filtersActive = Boolean(params.q || activeFilters);
  const reset = () => { setSearchText(""); state.reset(); };

  async function edit(person: CustomerSummary) {
    try {
      setEditing(await loadCustomer(person.id));
      editDrawer.open();
    } catch (error) {
      toast.danger(error instanceof ApiError ? error.message : t("customers.loadError"));
    }
  }

  const sorting: SortingState = params.sort === "name" ? [{ id: "name", desc: false }] : params.sort === "oldest" ? [{ id: "joined", desc: false }] : params.sort === "newest" ? [{ id: "joined", desc: true }] : [];
  const changeSorting: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    state.setFilters({ sort: next[0]?.id === "name" ? "name" : next[0]?.id === "joined" ? (next[0].desc ? "newest" : "oldest") : undefined });
  };

  const filterControls = (className?: string) => (
    <>
      <AdminSelect className={className} label={t("filters.allStatuses")} value={params.status ?? all} onChange={(value) => state.setFilters({ status: value === all ? undefined : (value as CustomerStatus) })} options={[{ value: all, label: t("filters.allStatuses") }, { value: "active", label: t("customers.active") }, { value: "inactive", label: t("customers.inactive") }]} />
      <AdminSelect className={className} label={t("customers.allCities")} value={params.city ?? all} onChange={(value) => state.setFilters({ city: value === all ? undefined : value })} options={[{ value: all, label: t("customers.allCities") }, ...(stats.data?.cities ?? []).map((value) => ({ value, label: value }))]} />
      <AdminSelect className={className} label={t("customers.joined.label")} value={params.joined ?? all} onChange={(value) => state.setFilters({ joined: value === all ? undefined : (value as JoinedWindow) })} options={joinedOptions.map((value) => ({ value, label: t(`customers.joined.${value}`) }))} />
    </>
  );

  const columns: ColumnDef<CustomerSummary>[] = [
    { id: "name", header: t("customers.columns.customer"), accessorFn: (row) => row.name, cell: ({ row }) => <div className="flex min-w-48 items-center gap-3"><CustomerAvatar name={row.original.name} size="sm" /><div className="min-w-0"><p className="truncate font-bold leading-tight">{row.original.name}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.reference}</p></div></div> },
    { id: "contact", header: t("customers.columns.contact"), enableSorting: false, accessorFn: (row) => row.phone, cell: ({ row }) => <div className="min-w-44"><p className="text-sm font-medium">{row.original.phone ?? "—"}</p><p className="truncate text-xs text-[var(--admin-muted)]">{row.original.email ?? "—"}</p></div> },
    { id: "city", header: t("customers.columns.location"), enableSorting: false, accessorFn: (row) => row.city, cell: ({ row }) => row.original.city ?? "—" },
    { id: "joined", header: t("customers.columns.joined"), accessorFn: (row) => row.createdAt, cell: ({ row }) => <span className="whitespace-nowrap">{formatCambodiaDate(row.original.createdAt)}</span> },
    { id: "bookings", header: t("customers.columns.bookings"), enableSorting: false, accessorFn: (row) => row.bookingCount, cell: ({ row }) => <div className="flex items-center gap-2 font-semibold tabular-nums">{row.original.bookingCount}{row.original.activeRentals ? <span className="inline-flex items-center gap-1 rounded-full bg-[#efe9ff] px-2 py-0.5 text-[11px] font-bold text-[#6246c7]"><span className="size-1.5 rounded-full bg-current" aria-hidden />{t("customers.active")}</span> : null}</div> },
    { id: "loans", header: t("customers.columns.loans"), enableSorting: false, accessorFn: (row) => row.loanCount, cell: ({ row }) => <span className="font-semibold tabular-nums">{row.original.loanCount}</span> },
    { id: "status", header: t("customers.columns.status"), enableSorting: false, accessorFn: (row) => row.status, cell: ({ row }) => <AdminStatusBadge status={row.original.status} /> },
  ];

  const emptyText = query.isLoading ? t("customers.loading") : filtersActive ? t("customers.noMatches") : t("customers.empty");
  const summary = stats.data;

  if (query.isError && !query.data) return <AdminPage><PageHeader title={t("pages.customers.title")} description={t("pages.customers.description")} /><AdminErrorState description={query.error instanceof ApiError ? query.error.message : undefined} onRetry={() => void query.refetch()} /></AdminPage>;

  return (
    <AdminPage>
      <PageHeader title={t("pages.customers.title")} description={t("pages.customers.description")} />

      <section aria-label={t("customers.overview")} aria-busy={stats.isLoading} className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard loading={stats.isLoading} tone="purple" label={t("customers.stats.total")} value={summary?.total ?? 0} icon={<UsersIcon size={22} weight="duotone" />} />
        <StatCard loading={stats.isLoading} tone="success" label={t("customers.stats.active")} value={summary?.active ?? 0} icon={<CarProfileIcon size={22} weight="duotone" />} secondary={t("customers.stats.inactive", { count: summary?.inactive ?? 0 })} />
        <StatCard loading={stats.isLoading} tone="accent" label={t("customers.stats.newCustomers")} value={summary?.newLast30Days ?? 0} icon={<UserPlusIcon size={22} weight="duotone" />} />
        <StatCard loading={stats.isLoading} tone="warning" label={t("customers.stats.rentals")} value={summary?.withActiveRentals ?? 0} icon={<CalendarCheckIcon size={22} weight="duotone" />} secondary={t("customers.stats.onTheRoad")} />
      </section>

      <ContentSection className="overflow-visible">
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <AdminSearch className="w-auto min-w-0 max-w-none flex-1 basis-0 sm:max-w-xl" value={searchText} onChange={setSearchText} placeholder={t("pages.customers.search")} />
            <Button variant="outline" className="relative min-h-11 shrink-0 lg:hidden" onPress={filterDrawer.open} aria-label={activeFilters ? t("filters.activeCount", { count: activeFilters }) : t("filters.filters")}>
              <SlidersHorizontalIcon size={18} /><span className="max-sm:sr-only">{t("filters.filters")}</span>
              {activeFilters ? <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--admin-accent)] text-[11px] font-extrabold text-[#111820]">{activeFilters}</span> : null}
            </Button>
          </div>
          <div className="hidden flex-wrap items-center gap-2 lg:flex">
            {filterControls()}
            {filtersActive ? <Button size="sm" variant="ghost" className="min-h-10" onPress={reset}><ArrowCounterClockwiseIcon size={15} />{t("filters.resetFilters")}</Button> : null}
            <p className="ml-auto text-xs font-semibold text-[var(--admin-muted)]" aria-live="polite">{t(total === 1 ? "customers.countOne" : "customers.count", { count: total })}</p>
          </div>
        </div>

        <AdminDataTable columns={columns} data={rows} label={t("pages.customers.title")} emptyState={emptyText} pagination={{ page, pageSize: CUSTOMER_PAGE_SIZE, total, onPageChange: state.setPage }} manualSorting sorting={sorting} onSortingChange={changeSorting} loading={query.isLoading} onRowNavigate={open} rowActions={(person) => <CustomerActions customer={person} onView={() => open(person)} onEdit={() => void edit(person)} />} minWidth={880} />
      </ContentSection>

      <Drawer.Backdrop isOpen={filterDrawer.isOpen} onOpenChange={filterDrawer.setOpen} className="adminOverlay">
        <Drawer.Content placement="bottom">
          <Drawer.Dialog aria-label={t("customers.filterTitle")}>
            <Drawer.Handle />
            <Drawer.Header><Drawer.Heading>{t("customers.filterTitle")}</Drawer.Heading></Drawer.Header>
            <Drawer.Body className="grid gap-3 overflow-y-auto">{filterControls("w-full")}</Drawer.Body>
            <Drawer.Footer className="grid grid-cols-2 gap-2">
              <Button variant="tertiary" className="min-h-11" isDisabled={!filtersActive} onPress={reset}>{t("filters.reset")}</Button>
              <Button variant="primary" className="min-h-11" onPress={filterDrawer.close}>{t(total === 1 ? "customers.showOne" : "customers.show", { count: total })}</Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>

      <CustomerEditDrawer customer={editing} isOpen={editDrawer.isOpen} onOpenChange={editDrawer.setOpen} />
    </AdminPage>
  );
}
