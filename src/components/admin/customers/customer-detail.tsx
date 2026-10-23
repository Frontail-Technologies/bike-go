"use client";

import { Button, Drawer, useOverlayState } from "@heroui/react";
import { ArrowRightIcon, CakeIcon, CalendarCheckIcon, CalendarDotsIcon, ClockIcon, EnvelopeSimpleIcon, EyeIcon, FileTextIcon, FlagIcon, HandCoinsIcon, HouseLineIcon, MapPinIcon, NotePencilIcon, PaperPlaneTiltIcon, PhoneIcon, ShieldCheckIcon, UserCircleIcon, UserPlusIcon, WalletIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { formatCambodiaDate } from "@/components/admin/controls";
import { adminVehicles } from "@/components/admin/data";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { ActivityTimeline, MoneyDisplay, type ActivityItem } from "@/components/admin/data-display/misc";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { CurrencyAmount } from "@/components/admin/money";
import { LoanStatusBadge } from "@/components/admin/loans/loan-parts";
import { AdminErrorState } from "@/components/admin/feedback";
import { AdminPage, ContentSection, PageHeader } from "@/components/admin/layout";
import { AdminBreadcrumbs, AdminTabs } from "@/components/admin/navigation";
import { VehiclePhoto } from "@/components/admin/vehicles/vehicle-photo";
import { cn } from "@/lib/cn";
import { CustomerAvatar } from "./customer-avatar";
import { activeRentals, getCustomer, monthsSince, totalSpentMinor, type Customer, type CustomerBooking, type CustomerDocument, type CustomerLoan } from "./customer-data";
import { CustomerEditDrawer } from "./customer-edit-drawer";

const dateTime = (value: string) => formatCambodiaDate(value, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const shortDate = (value: string) => formatCambodiaDate(value, { year: undefined });

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

const vehicleFor = (name: string) => adminVehicles.find((vehicle) => vehicle.name === name) ?? adminVehicles[0];

export function CustomerDetail({ id }: { id: string }) {
  const router = useRouter();
  const editDrawer = useOverlayState();
  const [overrides, setOverrides] = useState<Partial<Customer>>({});
  const [tab, setTab] = useState("overview");
  const [previewing, setPreviewing] = useState<CustomerDocument | null>(null);
  const base = getCustomer(id);

  if (!base) return <AdminPage><PageHeader title="Customer Details" /><AdminErrorState title="Customer not found" description="This UI preview does not contain that customer." /></AdminPage>;
  const customer: Customer = { ...base, ...overrides };
  const openBooking = (booking: CustomerBooking) => router.push(`/admin/bookings/${booking.detailId}`);
  const openLoan = (loan: CustomerLoan) => router.push(`/admin/loans/${loan.detailId}`);

  const vehicleCell: ColumnDef<CustomerBooking> = {
    accessorKey: "vehicle", header: "Vehicle",
    cell: ({ row }) => (
      <div className="flex min-w-48 items-center gap-3">
        <VehiclePhoto vehicle={vehicleFor(row.original.vehicle)} className="h-10 w-14 shrink-0 rounded-lg border border-[var(--admin-border)]" sizes="56px" />
        <div className="min-w-0"><p className="truncate font-bold leading-tight">{row.original.vehicle}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.reference}</p></div>
      </div>
    ),
  };
  const bookingColumns: ColumnDef<CustomerBooking>[] = [
    vehicleCell,
    { accessorKey: "pickupAt", header: "Pickup", cell: ({ row }) => <span className="whitespace-nowrap">{dateTime(row.original.pickupAt)}</span> },
    { accessorKey: "returnAt", header: "Return", cell: ({ row }) => <span className="whitespace-nowrap">{dateTime(row.original.returnAt)}</span> },
    { accessorKey: "location", header: "Location", cell: ({ row }) => <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><MapPinIcon size={14} className="text-[var(--admin-muted)]" aria-hidden />{row.original.location}</span> },
    { accessorKey: "amountMinor", header: "Amount", cell: ({ row }) => <MoneyDisplay amount={row.original.amountMinor} /> },
    { accessorKey: "status", header: "Booking", cell: ({ row }) => <AdminStatusBadge status={row.original.status} /> },
    { accessorKey: "paymentStatus", header: "Payment", cell: ({ row }) => <AdminStatusBadge status={row.original.paymentStatus} /> },
  ];
  const recentBookingColumns: ColumnDef<CustomerBooking>[] = [
    vehicleCell,
    { id: "dates", header: "Dates", accessorFn: (row) => row.pickupAt, cell: ({ row }) => <span className="whitespace-nowrap text-xs">{shortDate(row.original.pickupAt)} – {shortDate(row.original.returnAt)}</span> },
    { accessorKey: "location", header: "Location" },
    { accessorKey: "amountMinor", header: "Amount", cell: ({ row }) => <MoneyDisplay amount={row.original.amountMinor} /> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <AdminStatusBadge status={row.original.status} /> },
  ];
  const loanColumns: ColumnDef<CustomerLoan>[] = [
    { accessorKey: "reference", header: "Reference", cell: ({ row }) => <span className="font-bold">{row.original.reference}</span> },
    { accessorKey: "loanType", header: "Loan type" },
    { accessorKey: "requestedMinor", header: "Requested", cell: ({ row }) => <CurrencyAmount amount={row.original.requestedMinor} currency={row.original.currency} /> },
    { id: "currency", header: "Currency", accessorFn: (row) => row.currency },
    { accessorKey: "tenureMonths", header: "Tenure", cell: ({ row }) => `${row.original.tenureMonths} months` },
    { accessorKey: "submittedAt", header: "Submitted", cell: ({ row }) => <span className="whitespace-nowrap">{formatCambodiaDate(row.original.submittedAt)}</span> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <LoanStatusBadge status={row.original.status} /> },
  ];
  const recentLoanColumns: ColumnDef<CustomerLoan>[] = [loanColumns[1], loanColumns[2], { accessorKey: "submittedAt", header: "Submitted", cell: ({ row }) => <span className="whitespace-nowrap">{shortDate(row.original.submittedAt)}</span> }, loanColumns[6]];
  const documentColumns: ColumnDef<CustomerDocument>[] = [
    { accessorKey: "type", header: "Document", cell: ({ row }) => <span className="inline-flex items-center gap-2 font-semibold"><FileTextIcon size={16} className="text-[var(--admin-muted)]" aria-hidden />{row.original.type}</span> },
    { accessorKey: "loanReference", header: "Loan reference" },
    { accessorKey: "uploadedAt", header: "Uploaded", cell: ({ row }) => <span className="whitespace-nowrap">{dateTime(row.original.uploadedAt)}</span> },
    { accessorKey: "status", header: "Verification", cell: ({ row }) => <AdminStatusBadge status={row.original.status} /> },
  ];

  const viewBooking = (booking: CustomerBooking) => <Button size="sm" variant="outline" className="min-h-11 md:min-h-8" onPress={() => openBooking(booking)}><EyeIcon size={15} />View</Button>;
  const reviewLoan = (loan: CustomerLoan) => <Button size="sm" variant="outline" className="min-h-11 md:min-h-8" onPress={() => openLoan(loan)}>Review Loan</Button>;

  const timeline: ActivityItem[] = customer.activity.map((entry) => ({
    id: entry.id, title: entry.title, detail: entry.detail, time: `${dateTime(entry.at)} · ICT`,
    tone: entry.kind === "document" ? "success" : entry.kind === "loan" ? "warning" : "info",
    icon: entry.kind === "account" ? <UserPlusIcon size={16} /> : entry.kind === "booking" ? <CalendarCheckIcon size={16} /> : entry.kind === "loan" ? <HandCoinsIcon size={16} /> : <FileTextIcon size={16} />,
  }));

  const overview = (
    <div className="space-y-4 xl:space-y-5">
      <div className="grid items-stretch gap-4 lg:grid-cols-3 xl:gap-5">
        <Panel title="Personal Information">
          <dl className="space-y-4">
            <InfoRow icon={<UserCircleIcon size={18} />} label="Full name">{customer.name}</InfoRow>
            <InfoRow icon={<PhoneIcon size={18} />} label="Phone number">{customer.phone}</InfoRow>
            <InfoRow icon={<EnvelopeSimpleIcon size={18} />} label="Email address">{customer.email}</InfoRow>
            <InfoRow icon={<CakeIcon size={18} />} label="Date of birth">{formatCambodiaDate(customer.dateOfBirth)}</InfoRow>
            <InfoRow icon={<FlagIcon size={18} />} label="Nationality">{customer.nationality}</InfoRow>
            <InfoRow icon={<HouseLineIcon size={18} />} label="Address">{customer.address || "—"}</InfoRow>
          </dl>
        </Panel>
        <Panel title="Location & Account">
          <dl className="space-y-4">
            <InfoRow icon={<MapPinIcon size={18} />} label="Current location">{customer.city}, Cambodia</InfoRow>
            <InfoRow icon={<CalendarDotsIcon size={18} />} label="Join date">{formatCambodiaDate(customer.joinedAt)}</InfoRow>
            <InfoRow icon={<ShieldCheckIcon size={18} />} label="Login providers"><span className="mt-0.5 flex flex-wrap gap-1.5">{customer.providers.map((provider) => <span key={provider} className="rounded-full bg-[var(--admin-info-soft)] px-2 py-0.5 text-[11px] font-bold text-[var(--admin-info)]">{provider}</span>)}</span></InfoRow>
            <InfoRow icon={<PaperPlaneTiltIcon size={18} />} label="Telegram">{customer.telegramUsername ?? "Not linked"}</InfoRow>
            <InfoRow icon={<UserCircleIcon size={18} />} label="Profile status"><span className="mt-0.5 inline-block">{customer.profileComplete ? <AdminStatusBadge status="verified" /> : <AdminStatusBadge status="needs-review" />}</span></InfoRow>
          </dl>
        </Panel>
        <Panel title="Quick Stats">
          <dl className="space-y-4">
            <QuickStat tone="bg-[var(--admin-info-soft)] text-[var(--admin-info)]" icon={<CalendarCheckIcon size={20} weight="duotone" />} label="Total bookings" value={customer.bookings.length} />
            <QuickStat tone="bg-[var(--admin-accent-soft)] text-[var(--admin-warning)]" icon={<WalletIcon size={20} weight="duotone" />} label="Total spent (USD)" value={<MoneyDisplay amount={totalSpentMinor(customer)} className="text-lg font-extrabold" />} />
            <QuickStat tone="bg-[var(--admin-success-soft)] text-[var(--admin-success)]" icon={<HandCoinsIcon size={20} weight="duotone" />} label="Loan applications" value={customer.loans.length} />
            <QuickStat tone="bg-[var(--admin-success-soft)] text-[var(--admin-success)]" icon={<CalendarCheckIcon size={20} weight="duotone" />} label="Active rentals" value={activeRentals(customer)} />
            <QuickStat tone="bg-[#efe9ff] text-[#6246c7]" icon={<ClockIcon size={20} weight="duotone" />} label="Member since" value={`${monthsSince(customer.joinedAt)} months`} />
          </dl>
        </Panel>
      </div>
      <Panel title="Recent Bookings" action={<ViewAll label="View all" onPress={() => setTab("bookings")} />} flush>
        <AdminDataTable label="Recent bookings" columns={recentBookingColumns} data={customer.bookings.slice(0, 3)} showPagination={false} minWidth={760} emptyState="This customer has no bookings." onRowNavigate={openBooking} />
      </Panel>
      <Panel title="Recent Loan Applications" action={<ViewAll label="View all" onPress={() => setTab("loans")} />} flush>
        <AdminDataTable label="Recent loan applications" columns={recentLoanColumns} data={customer.loans.slice(0, 3)} showPagination={false} minWidth={620} emptyState="This customer has no loan applications." onRowNavigate={openLoan} />
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
          { id: "bookings", label: "Bookings", content: <ContentSection><AdminDataTable label="Customer bookings" columns={bookingColumns} data={customer.bookings} pageSize={6} minWidth={960} emptyState="This customer has no bookings." onRowNavigate={openBooking} rowActions={viewBooking} /></ContentSection> },
          { id: "loans", label: "Loan Applications", content: <ContentSection><AdminDataTable label="Customer loan applications" columns={loanColumns} data={customer.loans} pageSize={6} minWidth={820} emptyState="This customer has no loan applications." onRowNavigate={openLoan} rowActions={reviewLoan} /></ContentSection> },
          { id: "documents", label: "Documents", content: (
            <ContentSection><AdminDataTable label="Customer documents" columns={documentColumns} data={customer.documents} pageSize={6} minWidth={820} emptyState="No loan documents have been uploaded." rowActions={(doc) => <div className="flex justify-end gap-1.5"><Button size="sm" variant="ghost" className="min-h-11 md:min-h-8" onPress={() => setPreviewing(doc)}><EyeIcon size={15} />Preview</Button><Button size="sm" variant="outline" className="min-h-11 md:min-h-8" onPress={() => router.push(`/admin/documents/${doc.detailId}`)}>Open Review</Button></div>} /></ContentSection>
          ) },
          { id: "activity", label: "Activity", content: <Panel title="Account activity">{timeline.length ? <ActivityTimeline items={timeline} /> : <p className="text-sm text-[var(--admin-muted)]">No activity yet.</p>}</Panel> },
        ]}
      />

      <CustomerEditDrawer customer={customer} isOpen={editDrawer.isOpen} onOpenChange={editDrawer.setOpen} onSave={(_, values) => setOverrides((current) => ({ ...current, ...values }))} />

      <Drawer.Backdrop isOpen={Boolean(previewing)} onOpenChange={(open) => !open && setPreviewing(null)} className="adminOverlay">
        <Drawer.Content placement="right" className="w-full max-w-md">
          <Drawer.Dialog aria-label="Document preview">
            <Drawer.CloseTrigger />
            <Drawer.Header><Drawer.Heading>{previewing?.type ?? "Document"}</Drawer.Heading></Drawer.Header>
            <Drawer.Body className="space-y-4">
              <div className="adminTile flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl text-center text-[var(--admin-muted)]"><FileTextIcon size={36} weight="duotone" /><p className="px-6 text-sm">Document previews are not available in this demo.</p></div>
              {previewing ? <dl className="space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-[var(--admin-muted)]">Loan reference</dt><dd className="font-semibold">{previewing.loanReference}</dd></div><div className="flex justify-between gap-3"><dt className="text-[var(--admin-muted)]">Uploaded</dt><dd className="font-semibold">{dateTime(previewing.uploadedAt)} ICT</dd></div><div className="flex items-center justify-between gap-3"><dt className="text-[var(--admin-muted)]">Verification</dt><dd><AdminStatusBadge status={previewing.status} /></dd></div></dl> : null}
            </Drawer.Body>
            <Drawer.Footer><Button variant="primary" className="min-h-11" onPress={() => previewing && router.push(`/admin/documents/${previewing.detailId}`)}>Open Document Review</Button></Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </AdminPage>
  );
}
