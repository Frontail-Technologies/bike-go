"use client";

import { Button, useOverlayState } from "@heroui/react";
import { ArrowRightIcon, CakeIcon, CalendarCheckIcon, CalendarDotsIcon, ClockIcon, DownloadSimpleIcon, EnvelopeSimpleIcon, EyeIcon, FileTextIcon, FlagIcon, HandCoinsIcon, HouseLineIcon, MapPinIcon, NotePencilIcon, PaperPlaneTiltIcon, PhoneIcon, SealCheckIcon, ShieldCheckIcon, UserCircleIcon, UserPlusIcon, WalletIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { BookingStatusBadge } from "@/components/admin/bookings/booking-parts";
import { formatCambodiaDate } from "@/components/admin/controls";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { ActivityTimeline, type ActivityItem } from "@/components/admin/data-display/misc";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { PaymentStatusBadge } from "@/components/admin/bookings/booking-parts";
import { AdminErrorState, AdminLoadingState } from "@/components/admin/feedback";
import { AdminPage, ContentSection, PageHeader } from "@/components/admin/layout";
import { CurrencyAmount } from "@/components/admin/money";
import { AdminBreadcrumbs, AdminTabs } from "@/components/admin/navigation";
import { VehiclePhoto } from "@/components/admin/vehicles/vehicle-photo";
import { fmtShort, vehiclePhoto } from "@/features/admin/bookings/lib/booking-model";
import type { Booking } from "@/features/admin/bookings/types/booking";
import { ApiError } from "@/lib/api/error";
import { cn } from "@/lib/cn";
import { documentFileUrl } from "@/features/admin/documents/api/documents-api";
import { toLoanBadge, toVerificationBadge } from "@/features/admin/loans/lib/loan-model";
import { useCustomerActivityQuery, useCustomerBookingsQuery, useCustomerDocumentsQuery, useCustomerLoansQuery, useCustomerQuery } from "../hooks/use-customers";
import { asBookingStatus, monthsSince, titleCase } from "../lib/customer-model";
import type { Customer, CustomerDocument, CustomerLoan } from "../types/customer";
import { CustomerEditDrawer } from "./customer-edit-drawer";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

const TAB_PAGE_SIZE = 6;
const dateTime = (value: string) => formatCambodiaDate(value, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const shortDate = (value: string) => formatCambodiaDate(value, { year: undefined });
const money = (amount: number, currency: string) => <CurrencyAmount amount={amount} currency={currency === "KHR" ? "KHR" : "USD"} />;

function Panel({ title, action, children, className, flush = false }: { title: string; action?: ReactNode; children: ReactNode; className?: string; flush?: boolean }) {
  return (
    <section aria-label={title} className={cn("adminSurface rounded-2xl", flush ? "overflow-hidden" : "p-4 sm:p-5", className)}>
      <header className={cn("mb-4 flex items-center justify-between gap-3", flush && "mb-2 px-4 pt-4 sm:px-5 sm:pt-5")}><h2 className="text-sm font-extrabold">{title}</h2>{action}</header>
      {children}
    </section>
  );
}

function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-surface-muted)] text-[var(--admin-muted)]">{icon}</span>
      <div className="min-w-0 flex-1"><dt className="text-[11px] font-medium text-[var(--admin-muted)]">{label}</dt><dd className="break-words text-sm font-semibold">{children}</dd></div>
    </div>
  );
}

function QuickStat({ icon, label, value, tone }: { icon: ReactNode; label: string; value: ReactNode; tone: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", tone)}>{icon}</span>
      <div className="min-w-0"><dt className="text-[11px] font-medium text-[var(--admin-muted)]">{label}</dt><dd className="text-lg font-extrabold leading-tight">{value}</dd></div>
    </div>
  );
}

function ViewAll({ label, onPress }: { label: string; onPress: () => void }) {
  return <Button size="sm" variant="ghost" className="min-h-11 text-[var(--admin-accent-strong)] md:min-h-9" onPress={onPress}>{label}<ArrowRightIcon size={14} /></Button>;
}

const LoanStatus = ({ status }: { status: string }) => { useAdminTranslations(); const badge = toLoanBadge(status); return <AdminStatusBadge status={badge.status} label={badge.label} />; };

function BookingsTab({ customerId, onOpen }: { customerId: string; onOpen: (booking: Booking) => void }) {
  const t = useAdminTranslations();
  const [page, setPage] = useState(1);
  const query = useCustomerBookingsQuery(customerId, { page, pageSize: TAB_PAGE_SIZE });
  const columns: ColumnDef<Booking & { id: string }>[] = [
    { id: "vehicle", header: t("customers.detail.vehicle"), enableSorting: false, accessorFn: (row) => row.vehicle.name, cell: ({ row }) => (
      <div className="flex min-w-48 items-center gap-3">
        <VehiclePhoto vehicle={vehiclePhoto(row.original.vehicle)} className="h-10 w-14 shrink-0 rounded-lg border border-[var(--admin-border)]" sizes="56px" />
        <div className="min-w-0"><p className="truncate font-bold leading-tight">{row.original.vehicle.name}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.reference}</p></div>
      </div>
    ) },
    { id: "pickup", header: t("customers.detail.pickup"), enableSorting: false, accessorFn: (row) => row.pickupAt, cell: ({ row }) => <span className="whitespace-nowrap">{dateTime(row.original.pickupAt)}</span> },
    { id: "return", header: t("customers.detail.return"), enableSorting: false, accessorFn: (row) => row.returnAt, cell: ({ row }) => <span className="whitespace-nowrap">{dateTime(row.original.returnAt)}</span> },
    { id: "location", header: t("customers.detail.location"), enableSorting: false, accessorFn: (row) => row.pickupLocation.name, cell: ({ row }) => <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><MapPinIcon size={14} className="text-[var(--admin-muted)]" aria-hidden />{row.original.pickupLocation.name}</span> },
    { id: "amount", header: t("customers.detail.amount"), enableSorting: false, accessorFn: (row) => row.pricing.totalPayableMinor, cell: ({ row }) => money(row.original.pricing.totalPayableMinor, row.original.currency) },
    { id: "status", header: t("customers.detail.booking"), enableSorting: false, accessorFn: (row) => row.bookingStatus, cell: ({ row }) => <BookingStatusBadge status={row.original.bookingStatus} /> },
    { id: "payment", header: t("customers.detail.payment"), enableSorting: false, accessorFn: (row) => row.paymentStatus, cell: ({ row }) => <PaymentStatusBadge status={row.original.paymentStatus} /> },
  ];
  const data = (query.data?.data ?? []).map((row) => ({ ...row, id: row.reference }));
  if (query.isError && !query.data) return <AdminErrorState title={t("customers.detail.bookingsError")} description={query.error instanceof ApiError ? query.error.message : t("common.retryLater")} onRetry={() => void query.refetch()} />;
  return <ContentSection><AdminDataTable label={t("customers.detail.customerBookings")} columns={columns} data={data} loading={query.isLoading} pagination={{ page, pageSize: TAB_PAGE_SIZE, total: query.data?.meta.total ?? 0, onPageChange: setPage }} minWidth={960} emptyState={t("customers.detail.noBookings")} onRowNavigate={onOpen} rowActions={(booking) => <Button size="sm" variant="outline" className="min-h-11 md:min-h-8" onPress={() => onOpen(booking)}><EyeIcon size={15} />{t("customers.detail.view")}</Button>} /></ContentSection>;
}

function LoansTab({ customerId }: { customerId: string }) {
  const t = useAdminTranslations();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const query = useCustomerLoansQuery(customerId, { page, pageSize: TAB_PAGE_SIZE });
  const columns: ColumnDef<CustomerLoan & { id: string }>[] = [
    { id: "reference", header: t("customers.detail.reference"), enableSorting: false, accessorFn: (row) => row.reference, cell: ({ row }) => <span className="font-bold">{row.original.reference}</span> },
    { id: "loanType", header: t("customers.detail.loanType"), enableSorting: false, accessorFn: (row) => row.loanType, cell: ({ row }) => titleCase(row.original.loanType) },
    { id: "requested", header: t("customers.detail.requested"), enableSorting: false, accessorFn: (row) => row.requestedAmountMinor, cell: ({ row }) => money(row.original.requestedAmountMinor, row.original.currency) },
    { id: "currency", header: t("customers.detail.currency"), enableSorting: false, accessorFn: (row) => row.currency },
    { id: "tenure", header: t("customers.detail.tenure"), enableSorting: false, accessorFn: (row) => row.tenureMonths, cell: ({ row }) => t("customers.detail.months", { count: row.original.tenureMonths }) },
    { id: "submitted", header: t("customers.detail.submitted"), enableSorting: false, accessorFn: (row) => row.submittedAt, cell: ({ row }) => <span className="whitespace-nowrap">{row.original.submittedAt ? formatCambodiaDate(row.original.submittedAt) : t("customers.detail.notSubmitted")}</span> },
    { id: "status", header: t("customers.detail.status"), enableSorting: false, accessorFn: (row) => row.status, cell: ({ row }) => <LoanStatus status={row.original.status} /> },
  ];
  const data = (query.data?.data ?? []).map((row) => ({ ...row, id: row.reference }));
  if (query.isError && !query.data) return <AdminErrorState title={t("customers.detail.loansError")} description={query.error instanceof ApiError ? query.error.message : t("common.retryLater")} onRetry={() => void query.refetch()} />;
  return <ContentSection><AdminDataTable label={t("customers.detail.customerLoans")} columns={columns} data={data} loading={query.isLoading} pagination={{ page, pageSize: TAB_PAGE_SIZE, total: query.data?.meta.total ?? 0, onPageChange: setPage }} minWidth={820} emptyState={t("customers.detail.noLoans")} onRowNavigate={(loan) => router.push(`/admin/loans/${loan.reference}`)} rowActions={(loan) => <Button size="sm" variant="outline" className="min-h-11 md:min-h-8" onPress={() => router.push(`/admin/loans/${loan.reference}`)}>{t("customers.detail.reviewLoan")}</Button>} /></ContentSection>;
}

function DocumentsTab({ customerId }: { customerId: string }) {
  const t = useAdminTranslations();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const query = useCustomerDocumentsQuery(customerId, { page, pageSize: TAB_PAGE_SIZE });
  const columns: ColumnDef<CustomerDocument>[] = [
    { id: "type", header: t("customers.detail.document"), enableSorting: false, accessorFn: (row) => row.type, cell: ({ row }) => <span className="inline-flex items-center gap-2 font-semibold"><FileTextIcon size={16} className="text-[var(--admin-muted)]" aria-hidden />{titleCase(row.original.type)}</span> },
    { id: "filename", header: t("customers.detail.file"), enableSorting: false, accessorFn: (row) => row.originalFilename, cell: ({ row }) => <span className="block max-w-56 truncate">{row.original.originalFilename}</span> },
    { id: "loan", header: t("customers.detail.loanReference"), enableSorting: false, accessorFn: (row) => row.loan.reference },
    { id: "uploaded", header: t("customers.detail.uploaded"), enableSorting: false, accessorFn: (row) => row.uploadedAt, cell: ({ row }) => <span className="whitespace-nowrap">{dateTime(row.original.uploadedAt)}</span> },
    { id: "status", header: t("customers.detail.verification"), enableSorting: false, accessorFn: (row) => row.verificationStatus, cell: ({ row }) => { const badge = toVerificationBadge(row.original.verificationStatus); return <AdminStatusBadge status={badge.status} label={badge.label} />; } },
  ];
  if (query.isError && !query.data) return <AdminErrorState title={t("customers.detail.documentsError")} description={query.error instanceof ApiError ? query.error.message : t("common.retryLater")} onRetry={() => void query.refetch()} />;
  const actions = (doc: CustomerDocument) => (
    <div className="flex justify-end gap-1.5">
      <a href={documentFileUrl(doc.fileUrl)} target="_blank" rel="noopener noreferrer" aria-label={t("customers.detail.openFile", { name: doc.originalFilename })} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-xs font-bold text-[var(--admin-accent-strong)] outline-none hover:bg-[var(--admin-surface-muted)] focus-visible:ring-2 focus-visible:ring-[var(--admin-accent-strong)] md:min-h-8"><DownloadSimpleIcon size={15} />{t("customers.detail.open")}</a>
      <Button size="sm" variant="outline" className="min-h-11 md:min-h-8" onPress={() => router.push(`/admin/documents/${doc.id}`)}><SealCheckIcon size={15} />{t("customers.detail.review")}</Button>
    </div>
  );
  return <ContentSection><AdminDataTable label={t("customers.detail.customerDocuments")} columns={columns} data={query.data?.data ?? []} loading={query.isLoading} pagination={{ page, pageSize: TAB_PAGE_SIZE, total: query.data?.meta.total ?? 0, onPageChange: setPage }} minWidth={860} emptyState={t("customers.detail.noDocuments")} onRowNavigate={(doc) => router.push(`/admin/documents/${doc.id}`)} rowActions={actions} /></ContentSection>;
}

const activityIcon = { account: <UserPlusIcon size={16} />, booking: <CalendarCheckIcon size={16} />, loan: <HandCoinsIcon size={16} />, document: <FileTextIcon size={16} /> } as const;
const activityTone = { account: "info", booking: "info", loan: "warning", document: "success" } as const;

function ActivityTab({ customerId }: { customerId: string }) {
  const t = useAdminTranslations();
  const [page, setPage] = useState(1);
  const query = useCustomerActivityQuery(customerId, { page, pageSize: 15 });
  if (query.isError && !query.data) return <AdminErrorState title={t("customers.detail.activityError")} description={query.error instanceof ApiError ? query.error.message : t("common.retryLater")} onRetry={() => void query.refetch()} />;
  const meta = query.data?.meta;
  const items: ActivityItem[] = (query.data?.data ?? []).map((entry) => ({ id: entry.id, title: entry.title, detail: entry.detail ?? undefined, time: `${dateTime(entry.at)} · ICT`, tone: activityTone[entry.kind], icon: activityIcon[entry.kind] }));
  return (
    <Panel title={t("customers.detail.accountActivity")}>
      {query.isLoading ? <div role="status" aria-label={t("customers.detail.loadingActivity")} className="h-32 animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" /> : items.length ? <ActivityTimeline items={items} /> : <p className="text-sm text-[var(--admin-muted)]">{t("customers.detail.noActivity")}</p>}
      {meta && meta.totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--admin-border)] pt-3 text-xs text-[var(--admin-muted)]">
          <span>{t("customers.detail.pageOf", { page: meta.page, total: meta.totalPages })}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="min-h-11 md:min-h-9" isDisabled={page <= 1} onPress={() => setPage(page - 1)}>{t("customers.detail.newer")}</Button>
            <Button size="sm" variant="outline" className="min-h-11 md:min-h-9" isDisabled={page >= meta.totalPages} onPress={() => setPage(page + 1)}>{t("customers.detail.older")}</Button>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}

export function CustomerDetail({ id }: { id: string }) {
  const t = useAdminTranslations();
  const query = useCustomerQuery(id);
  const customer = query.data;
  if (query.isError && !customer) {
    const notFound = query.error instanceof ApiError && (query.error.status === 404 || query.error.status === 422);
    return <AdminPage><PageHeader title={t("pages.customers.detail")} /><AdminErrorState title={notFound ? t("customers.detail.notFound") : t("customers.detail.customerLoadError")} description={query.error instanceof ApiError ? query.error.message : t("common.retryLater")} onRetry={notFound ? undefined : () => void query.refetch()} /></AdminPage>;
  }
  if (!customer) return <AdminPage><PageHeader title={t("pages.customers.detail")} /><AdminLoadingState label={t("customers.detail.loadingCustomer")} /></AdminPage>;
  return <CustomerWorkspace customer={customer} />;
}

function CustomerWorkspace({ customer }: { customer: Customer }) {
  const t = useAdminTranslations();
  const router = useRouter();
  const editDrawer = useOverlayState();
  const [tab, setTab] = useState("overview");
  const openBooking = (booking: { reference: string }) => router.push(`/admin/bookings/${booking.reference}`);
  const { profile } = customer;

  const recentBookingColumns: ColumnDef<Customer["recentBookings"][number] & { id: string }>[] = [
    { id: "vehicle", header: t("customers.detail.vehicle"), enableSorting: false, accessorFn: (row) => row.vehicleName, cell: ({ row }) => <div className="min-w-40"><p className="truncate font-bold leading-tight">{row.original.vehicleName}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.reference}</p></div> },
    { id: "pickup", header: t("customers.detail.pickup"), enableSorting: false, accessorFn: (row) => row.pickupAt, cell: ({ row }) => <span className="whitespace-nowrap text-xs">{fmtShort(row.original.pickupAt)}</span> },
    { id: "amount", header: t("customers.detail.amount"), enableSorting: false, accessorFn: (row) => row.totalPayableMinor, cell: ({ row }) => money(row.original.totalPayableMinor, row.original.currency) },
    { id: "status", header: t("customers.detail.status"), enableSorting: false, accessorFn: (row) => row.bookingStatus, cell: ({ row }) => <BookingStatusBadge status={asBookingStatus(row.original.bookingStatus)} /> },
  ];
  const recentLoanColumns: ColumnDef<Customer["recentLoans"][number] & { id: string }>[] = [
    { id: "loanType", header: t("customers.detail.loanType"), enableSorting: false, accessorFn: (row) => row.loanType, cell: ({ row }) => <div><p className="font-bold">{titleCase(row.original.loanType)}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.reference}</p></div> },
    { id: "requested", header: t("customers.detail.requested"), enableSorting: false, accessorFn: (row) => row.requestedAmountMinor, cell: ({ row }) => money(row.original.requestedAmountMinor, row.original.currency) },
    { id: "created", header: t("customers.detail.created"), enableSorting: false, accessorFn: (row) => row.createdAt, cell: ({ row }) => <span className="whitespace-nowrap">{shortDate(row.original.createdAt)}</span> },
    { id: "status", header: t("customers.detail.status"), enableSorting: false, accessorFn: (row) => row.status, cell: ({ row }) => <LoanStatus status={row.original.status} /> },
  ];

  const overview = (
    <div className="space-y-4 xl:space-y-5">
      <div className="grid items-stretch gap-4 lg:grid-cols-3 xl:gap-5">
        <Panel title={t("customers.detail.personal")}>
          <dl className="space-y-4">
            <InfoRow icon={<UserCircleIcon size={18} />} label={t("customers.detail.fullName")}>{profile.fullName ?? customer.name}</InfoRow>
            <InfoRow icon={<PhoneIcon size={18} />} label={t("customers.detail.phone")}>{customer.phone ?? "—"}</InfoRow>
            <InfoRow icon={<EnvelopeSimpleIcon size={18} />} label={t("customers.detail.email")}>{customer.email ?? "—"}</InfoRow>
            <InfoRow icon={<CakeIcon size={18} />} label={t("customers.detail.dob")}>{profile.dateOfBirth ? formatCambodiaDate(profile.dateOfBirth) : "—"}</InfoRow>
            <InfoRow icon={<FlagIcon size={18} />} label={t("customers.detail.nationality")}>{profile.nationality ?? "—"}</InfoRow>
            <InfoRow icon={<HouseLineIcon size={18} />} label={t("customers.detail.address")}>{profile.address || "—"}</InfoRow>
          </dl>
        </Panel>
        <Panel title={t("customers.detail.locationAccount")}>
          <dl className="space-y-4">
            <InfoRow icon={<MapPinIcon size={18} />} label={t("customers.detail.currentLocation")}>{customer.city ? t("customers.detail.cityCountry", { city: customer.city }) : "—"}</InfoRow>
            <InfoRow icon={<CalendarDotsIcon size={18} />} label={t("customers.detail.joinDate")}>{formatCambodiaDate(customer.createdAt)}</InfoRow>
            <InfoRow icon={<ShieldCheckIcon size={18} />} label={t("customers.detail.providers")}>{customer.providers.length ? <span className="mt-0.5 flex flex-wrap gap-1.5">{customer.providers.map((provider) => <span key={provider} className="rounded-full bg-[#efe9ff] px-2 py-0.5 text-[11px] font-bold capitalize text-[#6246c7]">{provider}</span>)}</span> : t("customers.detail.none")}</InfoRow>
            <InfoRow icon={<PaperPlaneTiltIcon size={18} />} label={t("customers.detail.telegram")}>{profile.telegramUsername ?? t("customers.detail.notLinked")}</InfoRow>
          </dl>
        </Panel>
        <Panel title={t("customers.detail.quickStats")}>
          <dl className="space-y-4">
            <QuickStat tone="bg-[#efe9ff] text-[#6246c7]" icon={<CalendarCheckIcon size={20} weight="duotone" />} label={t("customers.detail.totalBookings")} value={customer.metrics.totalBookings} />
            <QuickStat tone="bg-[var(--admin-accent-soft)] text-[var(--admin-warning)]" icon={<WalletIcon size={20} weight="duotone" />} label={t("customers.detail.totalSpent")} value={<CurrencyAmount amount={customer.metrics.totalSpentMinor} currency="USD" className="text-lg font-extrabold" />} />
            <QuickStat tone="bg-[var(--admin-success-soft)] text-[var(--admin-success)]" icon={<HandCoinsIcon size={20} weight="duotone" />} label={t("customers.detail.loanApplications")} value={customer.loanCount} />
            <QuickStat tone="bg-[var(--admin-success-soft)] text-[var(--admin-success)]" icon={<CalendarCheckIcon size={20} weight="duotone" />} label={t("customers.detail.activeRentals")} value={customer.metrics.activeRentals} />
            <QuickStat tone="bg-[#efe9ff] text-[#6246c7]" icon={<ClockIcon size={20} weight="duotone" />} label={t("customers.detail.memberSince")} value={t("customers.detail.months", { count: monthsSince(customer.createdAt) })} />
          </dl>
        </Panel>
      </div>
      <Panel title={t("customers.detail.recentBookings")} action={<ViewAll label={t("customers.detail.viewAll")} onPress={() => setTab("bookings")} />} flush>
        <AdminDataTable label={t("customers.detail.recentBookingsLabel")} columns={recentBookingColumns} data={customer.recentBookings.map((row) => ({ ...row, id: row.reference }))} showPagination={false} minWidth={620} emptyState={t("customers.detail.noBookings")} onRowNavigate={openBooking} />
      </Panel>
      <Panel title={t("customers.detail.recentLoans")} action={<ViewAll label={t("customers.detail.viewAll")} onPress={() => setTab("loans")} />} flush>
        <AdminDataTable label={t("customers.detail.recentLoansLabel")} columns={recentLoanColumns} data={customer.recentLoans.map((row) => ({ ...row, id: row.reference }))} showPagination={false} minWidth={560} emptyState={t("customers.detail.noLoans")} onRowNavigate={(loan) => router.push(`/admin/loans/${loan.reference}`)} />
      </Panel>
    </div>
  );

  return (
    <AdminPage className="gap-4">
      <AdminBreadcrumbs items={[{ label: t("pages.customers.title"), href: "/admin/customers" }, { label: customer.name }]} />

      <header className="flex items-center gap-3 sm:gap-4">
        <CustomerAvatar name={customer.name} size="lg" className="size-14 text-lg sm:size-16 sm:text-xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="truncate text-xl font-extrabold tracking-tight sm:text-2xl">{customer.name}</h1>
            <AdminStatusBadge status={customer.status} />
          </div>
          <p className="text-sm text-[var(--admin-muted)]">{customer.reference}</p>
        </div>
        <Button variant="outline" aria-label={t("customers.detail.editCustomer")} className="min-h-11 shrink-0 max-sm:size-11 max-sm:min-w-11 max-sm:p-0" onPress={editDrawer.open}><NotePencilIcon /><span className="max-sm:sr-only">{t("customers.detail.edit")}</span></Button>
      </header>

      <AdminTabs
        label={t("customers.detail.information")}
        selectedKey={tab}
        onSelectionChange={setTab}
        items={[
          { id: "overview", label: t("customers.detail.tabs.overview"), content: overview },
          { id: "bookings", label: t("customers.detail.tabs.bookings"), content: <BookingsTab customerId={customer.id} onOpen={openBooking} /> },
          { id: "loans", label: t("customers.detail.tabs.loans"), content: <LoansTab customerId={customer.id} /> },
          { id: "documents", label: t("customers.detail.tabs.documents"), content: <DocumentsTab customerId={customer.id} /> },
          { id: "activity", label: t("customers.detail.tabs.activity"), content: <ActivityTab customerId={customer.id} /> },
        ]}
      />

      <CustomerEditDrawer customer={customer} isOpen={editDrawer.isOpen} onOpenChange={editDrawer.setOpen} />
    </AdminPage>
  );
}
