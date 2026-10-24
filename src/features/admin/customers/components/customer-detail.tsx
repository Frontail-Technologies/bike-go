"use client";

import { Alert, Button, FieldError, Label, ListBox, Modal, Select, TextArea, TextField, useOverlayState } from "@heroui/react";
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
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/error";
import { cn } from "@/lib/cn";
import { documentDownloadUrl } from "../api/customers-api";
import { useCustomerActivityQuery, useCustomerBookingsQuery, useCustomerDocumentsQuery, useCustomerLoansQuery, useCustomerMutations, useCustomerQuery } from "../hooks/use-customers";
import { asBookingStatus, documentBadge, loanBadge, monthsSince, titleCase } from "../lib/customer-model";
import type { Customer, CustomerDocument, CustomerLoan } from "../types/customer";
import { CustomerEditDrawer } from "./customer-edit-drawer";

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
  return <Button size="sm" variant="ghost" className="min-h-11 text-[var(--admin-info)] md:min-h-9" onPress={onPress}>{label}<ArrowRightIcon size={14} /></Button>;
}

const LoanStatus = ({ status }: { status: string }) => { const badge = loanBadge(status); return <AdminStatusBadge status={badge.status} label={badge.label} />; };

function BookingsTab({ customerId, onOpen }: { customerId: string; onOpen: (booking: Booking) => void }) {
  const [page, setPage] = useState(1);
  const query = useCustomerBookingsQuery(customerId, { page, pageSize: TAB_PAGE_SIZE });
  const columns: ColumnDef<Booking & { id: string }>[] = [
    { id: "vehicle", header: "Vehicle", enableSorting: false, accessorFn: (row) => row.vehicle.name, cell: ({ row }) => (
      <div className="flex min-w-48 items-center gap-3">
        <VehiclePhoto vehicle={vehiclePhoto(row.original.vehicle)} className="h-10 w-14 shrink-0 rounded-lg border border-[var(--admin-border)]" sizes="56px" />
        <div className="min-w-0"><p className="truncate font-bold leading-tight">{row.original.vehicle.name}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.reference}</p></div>
      </div>
    ) },
    { id: "pickup", header: "Pickup", enableSorting: false, accessorFn: (row) => row.pickupAt, cell: ({ row }) => <span className="whitespace-nowrap">{dateTime(row.original.pickupAt)}</span> },
    { id: "return", header: "Return", enableSorting: false, accessorFn: (row) => row.returnAt, cell: ({ row }) => <span className="whitespace-nowrap">{dateTime(row.original.returnAt)}</span> },
    { id: "location", header: "Location", enableSorting: false, accessorFn: (row) => row.pickupLocation.name, cell: ({ row }) => <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><MapPinIcon size={14} className="text-[var(--admin-muted)]" aria-hidden />{row.original.pickupLocation.name}</span> },
    { id: "amount", header: "Amount", enableSorting: false, accessorFn: (row) => row.pricing.totalPayableMinor, cell: ({ row }) => money(row.original.pricing.totalPayableMinor, row.original.currency) },
    { id: "status", header: "Booking", enableSorting: false, accessorFn: (row) => row.bookingStatus, cell: ({ row }) => <BookingStatusBadge status={row.original.bookingStatus} /> },
    { id: "payment", header: "Payment", enableSorting: false, accessorFn: (row) => row.paymentStatus, cell: ({ row }) => <PaymentStatusBadge status={row.original.paymentStatus} /> },
  ];
  const data = (query.data?.data ?? []).map((row) => ({ ...row, id: row.reference }));
  if (query.isError && !query.data) return <AdminErrorState title="Couldn’t load bookings" description={query.error instanceof ApiError ? query.error.message : "Try again in a moment."} onRetry={() => void query.refetch()} />;
  return <ContentSection><AdminDataTable label="Customer bookings" columns={columns} data={data} loading={query.isLoading} pagination={{ page, pageSize: TAB_PAGE_SIZE, total: query.data?.meta.total ?? 0, onPageChange: setPage }} minWidth={960} emptyState="This customer has no bookings." onRowNavigate={onOpen} rowActions={(booking) => <Button size="sm" variant="outline" className="min-h-11 md:min-h-8" onPress={() => onOpen(booking)}><EyeIcon size={15} />View</Button>} /></ContentSection>;
}

function LoansTab({ customerId }: { customerId: string }) {
  const [page, setPage] = useState(1);
  const query = useCustomerLoansQuery(customerId, { page, pageSize: TAB_PAGE_SIZE });
  const columns: ColumnDef<CustomerLoan & { id: string }>[] = [
    { id: "reference", header: "Reference", enableSorting: false, accessorFn: (row) => row.reference, cell: ({ row }) => <span className="font-bold">{row.original.reference}</span> },
    { id: "loanType", header: "Loan type", enableSorting: false, accessorFn: (row) => row.loanType, cell: ({ row }) => titleCase(row.original.loanType) },
    { id: "requested", header: "Requested", enableSorting: false, accessorFn: (row) => row.requestedAmountMinor, cell: ({ row }) => money(row.original.requestedAmountMinor, row.original.currency) },
    { id: "currency", header: "Currency", enableSorting: false, accessorFn: (row) => row.currency },
    { id: "tenure", header: "Tenure", enableSorting: false, accessorFn: (row) => row.tenureMonths, cell: ({ row }) => `${row.original.tenureMonths} months` },
    { id: "submitted", header: "Submitted", enableSorting: false, accessorFn: (row) => row.submittedAt, cell: ({ row }) => <span className="whitespace-nowrap">{row.original.submittedAt ? formatCambodiaDate(row.original.submittedAt) : "Not submitted"}</span> },
    { id: "status", header: "Status", enableSorting: false, accessorFn: (row) => row.status, cell: ({ row }) => <LoanStatus status={row.original.status} /> },
  ];
  const data = (query.data?.data ?? []).map((row) => ({ ...row, id: row.reference }));
  if (query.isError && !query.data) return <AdminErrorState title="Couldn’t load loan applications" description={query.error instanceof ApiError ? query.error.message : "Try again in a moment."} onRetry={() => void query.refetch()} />;
  return <ContentSection><AdminDataTable label="Customer loan applications" columns={columns} data={data} loading={query.isLoading} pagination={{ page, pageSize: TAB_PAGE_SIZE, total: query.data?.meta.total ?? 0, onPageChange: setPage }} minWidth={820} emptyState="This customer has no loan applications." /></ContentSection>;
}

const reviewOptions = [
  { value: "verified", label: "Verified" },
  { value: "needs_review", label: "Needs review" },
  { value: "rejected", label: "Rejected" },
] as const;

function ReviewForm({ document, onClose }: { document: CustomerDocument; onClose: () => void }) {
  const mutations = useCustomerMutations();
  const [status, setStatus] = useState<(typeof reviewOptions)[number]["value"]>(document.verificationStatus === "verified" || document.verificationStatus === "rejected" ? document.verificationStatus : "verified");
  const [note, setNote] = useState(document.reviewNote ?? "");
  const [noteError, setNoteError] = useState("");
  const [error, setError] = useState("");
  const noteRequired = status !== "verified";

  async function submit() {
    if (noteRequired && !note.trim()) { setNoteError("A note is required — the customer sees it."); return; }
    setError("");
    try {
      await mutations.reviewDocument.mutateAsync({ loanReference: document.loan.reference, documentId: document.id, verificationStatus: status, ...(note.trim() ? { note: note.trim() } : {}) });
      toast.success(`${titleCase(document.type)} marked ${titleCase(status).toLowerCase()}`);
      onClose();
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "Something went wrong. Try again.");
    }
  }

  return (
    <>
      <Modal.Body className="space-y-4">
        <p className="text-sm text-[var(--admin-muted)]">{titleCase(document.type)} · loan {document.loan.reference} · {document.originalFilename}</p>
        <Select value={status} onChange={(key) => { if (key !== null) { setStatus(String(key) as typeof status); setNoteError(""); } }}>
          <Label>Verification</Label>
          <Select.Trigger className="min-h-11"><Select.Value /><Select.Indicator /></Select.Trigger>
          <Select.Popover className="adminOverlay"><ListBox>{reviewOptions.map((option) => <ListBox.Item key={option.value} id={option.value} textValue={option.label}>{option.label}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
        </Select>
        <TextField value={note} onChange={(value) => { setNote(value.slice(0, 500)); setNoteError(""); }} isInvalid={Boolean(noteError)} isRequired={noteRequired}>
          <Label>Note{noteRequired ? "" : " (optional)"}</Label>
          <TextArea rows={3} placeholder="Shown to the applicant when the document needs review or is rejected." />
          <FieldError>{noteError}</FieldError>
        </TextField>
        {error ? <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>Review was not saved</Alert.Title><Alert.Description>{error}</Alert.Description></Alert.Content></Alert> : null}
      </Modal.Body>
      <Modal.Footer className="flex justify-end gap-2">
        <Button variant="tertiary" className="min-h-11" onPress={onClose}>Cancel</Button>
        <Button variant="primary" className="min-h-11" isPending={mutations.reviewDocument.isPending} onPress={() => void submit()}>Save review</Button>
      </Modal.Footer>
    </>
  );
}

function DocumentsTab({ customerId }: { customerId: string }) {
  const [page, setPage] = useState(1);
  const [reviewing, setReviewing] = useState<CustomerDocument | null>(null);
  const query = useCustomerDocumentsQuery(customerId, { page, pageSize: TAB_PAGE_SIZE });
  const columns: ColumnDef<CustomerDocument>[] = [
    { id: "type", header: "Document", enableSorting: false, accessorFn: (row) => row.type, cell: ({ row }) => <span className="inline-flex items-center gap-2 font-semibold"><FileTextIcon size={16} className="text-[var(--admin-muted)]" aria-hidden />{titleCase(row.original.type)}</span> },
    { id: "filename", header: "File", enableSorting: false, accessorFn: (row) => row.originalFilename, cell: ({ row }) => <span className="block max-w-56 truncate">{row.original.originalFilename}</span> },
    { id: "loan", header: "Loan reference", enableSorting: false, accessorFn: (row) => row.loan.reference },
    { id: "uploaded", header: "Uploaded", enableSorting: false, accessorFn: (row) => row.uploadedAt, cell: ({ row }) => <span className="whitespace-nowrap">{dateTime(row.original.uploadedAt)}</span> },
    { id: "status", header: "Verification", enableSorting: false, accessorFn: (row) => row.verificationStatus, cell: ({ row }) => { const badge = documentBadge(row.original.verificationStatus); return <AdminStatusBadge status={badge.status} label={badge.label} />; } },
  ];
  if (query.isError && !query.data) return <AdminErrorState title="Couldn’t load documents" description={query.error instanceof ApiError ? query.error.message : "Try again in a moment."} onRetry={() => void query.refetch()} />;
  const actions = (doc: CustomerDocument) => (
    <div className="flex justify-end gap-1.5">
      <a href={documentDownloadUrl(doc.fileUrl)} target="_blank" rel="noopener noreferrer" aria-label={`Open ${doc.originalFilename}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-xs font-bold text-[var(--admin-info)] outline-none hover:bg-[var(--admin-surface-muted)] focus-visible:ring-2 focus-visible:ring-[var(--admin-accent-strong)] md:min-h-8"><DownloadSimpleIcon size={15} />Open</a>
      <Button size="sm" variant="outline" className="min-h-11 md:min-h-8" onPress={() => setReviewing(doc)}><SealCheckIcon size={15} />Review</Button>
    </div>
  );
  return (
    <>
      <ContentSection><AdminDataTable label="Customer documents" columns={columns} data={query.data?.data ?? []} loading={query.isLoading} pagination={{ page, pageSize: TAB_PAGE_SIZE, total: query.data?.meta.total ?? 0, onPageChange: setPage }} minWidth={860} emptyState="No loan documents have been uploaded." rowActions={actions} /></ContentSection>
      <Modal.Backdrop isOpen={Boolean(reviewing)} onOpenChange={(open) => !open && setReviewing(null)} className="adminOverlay">
        <Modal.Container size="md">
          <Modal.Dialog aria-label="Review document">
            <Modal.CloseTrigger />
            <Modal.Header><Modal.Heading>Review document</Modal.Heading></Modal.Header>
            {reviewing ? <ReviewForm key={reviewing.id} document={reviewing} onClose={() => setReviewing(null)} /> : null}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}

const activityIcon = { account: <UserPlusIcon size={16} />, booking: <CalendarCheckIcon size={16} />, loan: <HandCoinsIcon size={16} />, document: <FileTextIcon size={16} /> } as const;
const activityTone = { account: "info", booking: "info", loan: "warning", document: "success" } as const;

function ActivityTab({ customerId }: { customerId: string }) {
  const [page, setPage] = useState(1);
  const query = useCustomerActivityQuery(customerId, { page, pageSize: 15 });
  if (query.isError && !query.data) return <AdminErrorState title="Couldn’t load activity" description={query.error instanceof ApiError ? query.error.message : "Try again in a moment."} onRetry={() => void query.refetch()} />;
  const meta = query.data?.meta;
  const items: ActivityItem[] = (query.data?.data ?? []).map((entry) => ({ id: entry.id, title: entry.title, detail: entry.detail ?? undefined, time: `${dateTime(entry.at)} · ICT`, tone: activityTone[entry.kind], icon: activityIcon[entry.kind] }));
  return (
    <Panel title="Account activity">
      {query.isLoading ? <div role="status" aria-label="Loading activity" className="h-32 animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" /> : items.length ? <ActivityTimeline items={items} /> : <p className="text-sm text-[var(--admin-muted)]">No activity yet.</p>}
      {meta && meta.totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--admin-border)] pt-3 text-xs text-[var(--admin-muted)]">
          <span>Page {meta.page} of {meta.totalPages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="min-h-11 md:min-h-9" isDisabled={page <= 1} onPress={() => setPage(page - 1)}>Newer</Button>
            <Button size="sm" variant="outline" className="min-h-11 md:min-h-9" isDisabled={page >= meta.totalPages} onPress={() => setPage(page + 1)}>Older</Button>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}

export function CustomerDetail({ id }: { id: string }) {
  const query = useCustomerQuery(id);
  const customer = query.data;
  if (query.isError && !customer) {
    const notFound = query.error instanceof ApiError && (query.error.status === 404 || query.error.status === 422);
    return <AdminPage><PageHeader title="Customer Details" /><AdminErrorState title={notFound ? "Customer not found" : "Couldn’t load the customer"} description={query.error instanceof ApiError ? query.error.message : "Try again in a moment."} onRetry={notFound ? undefined : () => void query.refetch()} /></AdminPage>;
  }
  if (!customer) return <AdminPage><PageHeader title="Customer Details" /><AdminLoadingState label="Loading customer…" /></AdminPage>;
  return <CustomerWorkspace customer={customer} />;
}

function CustomerWorkspace({ customer }: { customer: Customer }) {
  const router = useRouter();
  const editDrawer = useOverlayState();
  const [tab, setTab] = useState("overview");
  const openBooking = (booking: { reference: string }) => router.push(`/admin/bookings/${booking.reference}`);
  const { profile } = customer;

  const recentBookingColumns: ColumnDef<Customer["recentBookings"][number] & { id: string }>[] = [
    { id: "vehicle", header: "Vehicle", enableSorting: false, accessorFn: (row) => row.vehicleName, cell: ({ row }) => <div className="min-w-40"><p className="truncate font-bold leading-tight">{row.original.vehicleName}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.reference}</p></div> },
    { id: "pickup", header: "Pickup", enableSorting: false, accessorFn: (row) => row.pickupAt, cell: ({ row }) => <span className="whitespace-nowrap text-xs">{fmtShort(row.original.pickupAt)}</span> },
    { id: "amount", header: "Amount", enableSorting: false, accessorFn: (row) => row.totalPayableMinor, cell: ({ row }) => money(row.original.totalPayableMinor, row.original.currency) },
    { id: "status", header: "Status", enableSorting: false, accessorFn: (row) => row.bookingStatus, cell: ({ row }) => <BookingStatusBadge status={asBookingStatus(row.original.bookingStatus)} /> },
  ];
  const recentLoanColumns: ColumnDef<Customer["recentLoans"][number] & { id: string }>[] = [
    { id: "loanType", header: "Loan type", enableSorting: false, accessorFn: (row) => row.loanType, cell: ({ row }) => <div><p className="font-bold">{titleCase(row.original.loanType)}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.reference}</p></div> },
    { id: "requested", header: "Requested", enableSorting: false, accessorFn: (row) => row.requestedAmountMinor, cell: ({ row }) => money(row.original.requestedAmountMinor, row.original.currency) },
    { id: "created", header: "Created", enableSorting: false, accessorFn: (row) => row.createdAt, cell: ({ row }) => <span className="whitespace-nowrap">{shortDate(row.original.createdAt)}</span> },
    { id: "status", header: "Status", enableSorting: false, accessorFn: (row) => row.status, cell: ({ row }) => <LoanStatus status={row.original.status} /> },
  ];

  const overview = (
    <div className="space-y-4 xl:space-y-5">
      <div className="grid items-stretch gap-4 lg:grid-cols-3 xl:gap-5">
        <Panel title="Personal Information">
          <dl className="space-y-4">
            <InfoRow icon={<UserCircleIcon size={18} />} label="Full name">{profile.fullName ?? customer.name}</InfoRow>
            <InfoRow icon={<PhoneIcon size={18} />} label="Phone number">{customer.phone ?? "—"}</InfoRow>
            <InfoRow icon={<EnvelopeSimpleIcon size={18} />} label="Email address">{customer.email ?? "—"}</InfoRow>
            <InfoRow icon={<CakeIcon size={18} />} label="Date of birth">{profile.dateOfBirth ? formatCambodiaDate(profile.dateOfBirth) : "—"}</InfoRow>
            <InfoRow icon={<FlagIcon size={18} />} label="Nationality">{profile.nationality ?? "—"}</InfoRow>
            <InfoRow icon={<HouseLineIcon size={18} />} label="Address">{profile.address || "—"}</InfoRow>
          </dl>
        </Panel>
        <Panel title="Location & Account">
          <dl className="space-y-4">
            <InfoRow icon={<MapPinIcon size={18} />} label="Current location">{customer.city ? `${customer.city}, Cambodia` : "—"}</InfoRow>
            <InfoRow icon={<CalendarDotsIcon size={18} />} label="Join date">{formatCambodiaDate(customer.createdAt)}</InfoRow>
            <InfoRow icon={<ShieldCheckIcon size={18} />} label="Login providers">{customer.providers.length ? <span className="mt-0.5 flex flex-wrap gap-1.5">{customer.providers.map((provider) => <span key={provider} className="rounded-full bg-[var(--admin-info-soft)] px-2 py-0.5 text-[11px] font-bold capitalize text-[var(--admin-info)]">{provider}</span>)}</span> : "None"}</InfoRow>
            <InfoRow icon={<PaperPlaneTiltIcon size={18} />} label="Telegram">{profile.telegramUsername ?? "Not linked"}</InfoRow>
          </dl>
        </Panel>
        <Panel title="Quick Stats">
          <dl className="space-y-4">
            <QuickStat tone="bg-[var(--admin-info-soft)] text-[var(--admin-info)]" icon={<CalendarCheckIcon size={20} weight="duotone" />} label="Total bookings" value={customer.metrics.totalBookings} />
            <QuickStat tone="bg-[var(--admin-accent-soft)] text-[var(--admin-warning)]" icon={<WalletIcon size={20} weight="duotone" />} label="Total spent (USD, paid)" value={<CurrencyAmount amount={customer.metrics.totalSpentMinor} currency="USD" className="text-lg font-extrabold" />} />
            <QuickStat tone="bg-[var(--admin-success-soft)] text-[var(--admin-success)]" icon={<HandCoinsIcon size={20} weight="duotone" />} label="Loan applications" value={customer.loanCount} />
            <QuickStat tone="bg-[var(--admin-success-soft)] text-[var(--admin-success)]" icon={<CalendarCheckIcon size={20} weight="duotone" />} label="Active rentals" value={customer.metrics.activeRentals} />
            <QuickStat tone="bg-[#efe9ff] text-[#6246c7]" icon={<ClockIcon size={20} weight="duotone" />} label="Member since" value={`${monthsSince(customer.createdAt)} months`} />
          </dl>
        </Panel>
      </div>
      <Panel title="Recent Bookings" action={<ViewAll label="View all" onPress={() => setTab("bookings")} />} flush>
        <AdminDataTable label="Recent bookings" columns={recentBookingColumns} data={customer.recentBookings.map((row) => ({ ...row, id: row.reference }))} showPagination={false} minWidth={620} emptyState="This customer has no bookings." onRowNavigate={openBooking} />
      </Panel>
      <Panel title="Recent Loan Applications" action={<ViewAll label="View all" onPress={() => setTab("loans")} />} flush>
        <AdminDataTable label="Recent loan applications" columns={recentLoanColumns} data={customer.recentLoans.map((row) => ({ ...row, id: row.reference }))} showPagination={false} minWidth={560} emptyState="This customer has no loan applications." />
      </Panel>
    </div>
  );

  return (
    <AdminPage className="gap-4">
      <AdminBreadcrumbs items={[{ label: "Customers", href: "/admin/customers" }, { label: customer.name }]} />

      <header className="flex items-center gap-3 sm:gap-4">
        <CustomerAvatar name={customer.name} size="lg" className="size-14 text-lg sm:size-16 sm:text-xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="truncate text-xl font-extrabold tracking-tight sm:text-2xl">{customer.name}</h1>
            <AdminStatusBadge status={customer.status} />
          </div>
          <p className="text-sm text-[var(--admin-muted)]">{customer.reference}</p>
        </div>
        <Button variant="outline" aria-label="Edit customer" className="min-h-11 shrink-0 max-sm:size-11 max-sm:min-w-11 max-sm:p-0" onPress={editDrawer.open}><NotePencilIcon /><span className="max-sm:sr-only">Edit</span></Button>
      </header>

      <AdminTabs
        label="Customer information"
        selectedKey={tab}
        onSelectionChange={setTab}
        items={[
          { id: "overview", label: "Overview", content: overview },
          { id: "bookings", label: "Bookings", content: <BookingsTab customerId={customer.id} onOpen={openBooking} /> },
          { id: "loans", label: "Loan Applications", content: <LoansTab customerId={customer.id} /> },
          { id: "documents", label: "Documents", content: <DocumentsTab customerId={customer.id} /> },
          { id: "activity", label: "Activity", content: <ActivityTab customerId={customer.id} /> },
        ]}
      />

      <CustomerEditDrawer customer={customer} isOpen={editDrawer.isOpen} onOpenChange={editDrawer.setOpen} />
    </AdminPage>
  );
}
