"use client";

import { Button, Drawer, useOverlayState } from "@heroui/react";
import { ArrowRightIcon, CalendarCheckIcon, CarProfileIcon, EnvelopeSimpleIcon, EyeIcon, FileTextIcon, HandCoinsIcon, MapPinIcon, NotePencilIcon, PhoneIcon, UserPlusIcon, WalletIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { formatCambodiaDate } from "@/components/admin/controls";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { ActivityTimeline, MoneyDisplay, type ActivityItem } from "@/components/admin/data-display/misc";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { AdminErrorState } from "@/components/admin/feedback";
import { AdminPage, ContentSection, DetailList, PageHeader } from "@/components/admin/layout";
import { AdminBreadcrumbs, AdminTabs } from "@/components/admin/navigation";
import { cn } from "@/lib/cn";
import { CustomerAvatar } from "./customer-avatar";
import { activeRentals, getCustomer, totalSpentMinor, type Customer, type CustomerBooking, type CustomerDocument, type CustomerLoan } from "./customer-data";
import { CustomerEditDrawer } from "./customer-edit-drawer";

const dateTime = (value: string) => formatCambodiaDate(value, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

function Chip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return <li className="adminTile inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold"><span className="shrink-0 text-[var(--admin-muted)]">{icon}</span><span className="truncate">{children}</span></li>;
}

function Stat({ icon, label, value, tone }: { icon: ReactNode; label: string; value: ReactNode; tone: string }) {
  return (
    <div className="adminTile flex min-w-[10.5rem] shrink-0 snap-start items-center gap-3 rounded-2xl p-3.5 md:min-w-0">
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", tone)}>{icon}</span>
      <div className="min-w-0"><p className="truncate text-lg font-extrabold leading-tight">{value}</p><p className="truncate text-xs text-[var(--admin-muted)]">{label}</p></div>
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={title} className="adminSurface rounded-2xl p-4 sm:p-5">
      <header className="mb-4 flex items-center justify-between gap-3"><h2 className="text-sm font-extrabold">{title}</h2>{action}</header>
      {children}
    </section>
  );
}

function ViewAll({ label, onPress }: { label: string; onPress: () => void }) {
  return <Button size="sm" variant="ghost" className="min-h-11 text-[var(--admin-info)] md:min-h-9" onPress={onPress}>{label}<ArrowRightIcon size={14} /></Button>;
}

export function CustomerDetail({ id }: { id: string }) {
  const router = useRouter();
  const editDrawer = useOverlayState();
  const [overrides, setOverrides] = useState<Partial<Customer>>({});
  const [tab, setTab] = useState("overview");
  const [previewing, setPreviewing] = useState<CustomerDocument | null>(null);
  const base = getCustomer(id);

  if (!base) return <AdminPage><PageHeader title="Customer Details" /><AdminErrorState title="Customer not found" description="This UI preview does not contain that customer." /></AdminPage>;
  const customer: Customer = { ...base, ...overrides };
  const rentals = activeRentals(customer);

  const bookingColumns: ColumnDef<CustomerBooking>[] = [
    { accessorKey: "reference", header: "Booking", cell: ({ row }) => <span className="font-bold">{row.original.reference}</span> },
    { accessorKey: "vehicle", header: "Vehicle", cell: ({ row }) => <div className="min-w-36"><p className="font-semibold">{row.original.vehicle}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.registration}</p></div> },
    { accessorKey: "pickupAt", header: "Pickup", cell: ({ row }) => <span className="whitespace-nowrap">{dateTime(row.original.pickupAt)}</span> },
    { accessorKey: "returnAt", header: "Return", cell: ({ row }) => <span className="whitespace-nowrap">{dateTime(row.original.returnAt)}</span> },
    { accessorKey: "location", header: "Location" },
    { accessorKey: "amountMinor", header: "Amount", cell: ({ row }) => <MoneyDisplay amount={row.original.amountMinor} /> },
    { accessorKey: "status", header: "Booking", cell: ({ row }) => <AdminStatusBadge status={row.original.status} /> },
    { accessorKey: "paymentStatus", header: "Payment", cell: ({ row }) => <AdminStatusBadge status={row.original.paymentStatus} /> },
  ];
  const loanColumns: ColumnDef<CustomerLoan>[] = [
    { accessorKey: "reference", header: "Reference", cell: ({ row }) => <span className="font-bold">{row.original.reference}</span> },
    { accessorKey: "loanType", header: "Loan type" },
    { accessorKey: "requestedMinor", header: "Requested", cell: ({ row }) => <MoneyDisplay amount={row.original.requestedMinor} /> },
    { id: "currency", header: "Currency", accessorFn: () => "USD" },
    { accessorKey: "tenureMonths", header: "Tenure", cell: ({ row }) => `${row.original.tenureMonths} months` },
    { accessorKey: "submittedAt", header: "Submitted", cell: ({ row }) => <span className="whitespace-nowrap">{formatCambodiaDate(row.original.submittedAt)}</span> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <AdminStatusBadge status={row.original.status} /> },
  ];
  const documentColumns: ColumnDef<CustomerDocument>[] = [
    { accessorKey: "type", header: "Document", cell: ({ row }) => <span className="inline-flex items-center gap-2 font-semibold"><FileTextIcon size={16} className="text-[var(--admin-muted)]" aria-hidden />{row.original.type}</span> },
    { accessorKey: "loanReference", header: "Loan reference" },
    { accessorKey: "uploadedAt", header: "Uploaded", cell: ({ row }) => <span className="whitespace-nowrap">{dateTime(row.original.uploadedAt)}</span> },
    { accessorKey: "status", header: "Verification", cell: ({ row }) => <AdminStatusBadge status={row.original.status} /> },
  ];

  const timeline: ActivityItem[] = customer.activity.map((entry) => ({
    id: entry.id, title: entry.title, detail: entry.detail, time: `${dateTime(entry.at)} · ICT`,
    tone: entry.kind === "document" ? "success" : entry.kind === "loan" ? "warning" : "info",
    icon: entry.kind === "account" ? <UserPlusIcon size={16} /> : entry.kind === "booking" ? <CalendarCheckIcon size={16} /> : entry.kind === "loan" ? <HandCoinsIcon size={16} /> : <FileTextIcon size={16} />,
  }));

  const overview = (
    <div className="grid items-start gap-4 xl:grid-cols-2 xl:gap-5">
      <Panel title="Personal Information">
        <DetailList columns={2} items={[
          { label: "Full name", value: customer.name }, { label: "Phone", value: customer.phone }, { label: "Email", value: <span className="break-all">{customer.email}</span> },
          { label: "Date of birth", value: formatCambodiaDate(customer.dateOfBirth) }, { label: "Nationality", value: customer.nationality }, { label: "City", value: customer.city },
          { label: "Address", value: customer.address || "—" },
        ]} />
      </Panel>
      <Panel title="Account Information">
        <DetailList columns={2} items={[
          { label: "Joined", value: formatCambodiaDate(customer.joinedAt) },
          { label: "Login providers", value: <span className="flex flex-wrap gap-1.5">{customer.providers.map((provider) => <span key={provider} className="rounded-full bg-[var(--admin-info-soft)] px-2 py-0.5 text-[11px] font-bold text-[var(--admin-info)]">{provider}</span>)}</span> },
          { label: "Telegram", value: customer.telegramUsername ?? "Not linked" },
          { label: "Profile status", value: customer.profileComplete ? <AdminStatusBadge status="verified" /> : <AdminStatusBadge status="needs-review" /> },
        ]} />
      </Panel>
      <Panel title="Recent Bookings" action={<ViewAll label="View all bookings" onPress={() => setTab("bookings")} />}>
        {customer.bookings.length ? (
          <ul className="-my-2 divide-y divide-[var(--admin-border)]">
            {customer.bookings.slice(0, 3).map((booking) => (
              <li key={booking.id} className="flex items-center gap-3 py-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-accent-soft)] text-[var(--admin-warning)]"><CarProfileIcon size={20} weight="duotone" aria-hidden /></span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{booking.vehicle}</p><p className="truncate text-xs text-[var(--admin-muted)]">{formatCambodiaDate(booking.pickupAt, { year: undefined })} · {booking.location}</p></div>
                <div className="flex flex-col items-end gap-1"><MoneyDisplay amount={booking.amountMinor} className="text-sm" /><AdminStatusBadge status={booking.status} /></div>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-[var(--admin-muted)]">No bookings yet.</p>}
      </Panel>
      <Panel title="Recent Loan Applications" action={<ViewAll label="View all applications" onPress={() => setTab("loans")} />}>
        {customer.loans.length ? (
          <ul className="-my-2 divide-y divide-[var(--admin-border)]">
            {customer.loans.slice(0, 3).map((loan) => (
              <li key={loan.id} className="flex items-center gap-3 py-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]"><HandCoinsIcon size={20} weight="duotone" aria-hidden /></span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{loan.loanType}</p><p className="truncate text-xs text-[var(--admin-muted)]">{loan.reference} · {formatCambodiaDate(loan.submittedAt)}</p></div>
                <div className="flex flex-col items-end gap-1"><MoneyDisplay amount={loan.requestedMinor} className="text-sm" /><AdminStatusBadge status={loan.status} /></div>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-[var(--admin-muted)]">No loan applications.</p>}
      </Panel>
    </div>
  );

  return (
    <AdminPage className="gap-5">
      <AdminBreadcrumbs items={[{ label: "Customers", href: "/admin/customers" }, { label: customer.name }]} />

      <section aria-label="Customer profile" className="adminHero rounded-3xl p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <CustomerAvatar name={customer.name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{customer.name}</h1>
              <AdminStatusBadge status={customer.status} />
            </div>
            <p className="mt-0.5 text-sm text-[var(--admin-muted)]">{customer.reference}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              <Chip icon={<EnvelopeSimpleIcon size={14} />}>{customer.email}</Chip>
              <Chip icon={<PhoneIcon size={14} />}>{customer.phone}</Chip>
              <Chip icon={<MapPinIcon size={14} />}>{customer.city}</Chip>
              <Chip icon={<CalendarCheckIcon size={14} />}>Joined {formatCambodiaDate(customer.joinedAt)}</Chip>
            </ul>
          </div>
          <Button variant="outline" aria-label="Edit customer" className="min-h-11 shrink-0 max-sm:size-11 max-sm:min-w-11 max-sm:p-0" onPress={editDrawer.open}><NotePencilIcon /><span className="max-sm:sr-only">Edit</span></Button>
        </div>
        <div className="-mx-4 mt-5 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:-mx-5 sm:px-5 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 md:pb-0" role="list" aria-label="Customer quick stats">
          <Stat tone="bg-[var(--admin-info-soft)] text-[var(--admin-info)]" icon={<CalendarCheckIcon size={20} weight="duotone" />} label="Total bookings" value={customer.bookings.length} />
          <Stat tone="bg-[var(--admin-success-soft)] text-[var(--admin-success)]" icon={<CarProfileIcon size={20} weight="duotone" />} label="Active rentals" value={rentals} />
          <Stat tone="bg-[var(--admin-accent-soft)] text-[var(--admin-warning)]" icon={<WalletIcon size={20} weight="duotone" />} label="Total spend (USD)" value={<MoneyDisplay amount={totalSpentMinor(customer)} className="text-lg font-extrabold" />} />
          <Stat tone="bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]" icon={<HandCoinsIcon size={20} weight="duotone" />} label="Loan applications" value={customer.loans.length} />
        </div>
      </section>

      <AdminTabs
        label="Customer information"
        selectedKey={tab}
        onSelectionChange={setTab}
        items={[
          { id: "overview", label: "Overview", content: overview },
          { id: "bookings", label: "Bookings", content: (
            <ContentSection><AdminDataTable label="Customer bookings" columns={bookingColumns} data={customer.bookings} pageSize={6} minWidth={960} emptyState="This customer has no bookings." rowActions={(booking) => <Button size="sm" variant="outline" className="min-h-11 md:min-h-8" onPress={() => router.push(`/admin/bookings/${booking.detailId}`)}><EyeIcon size={15} />View</Button>} /></ContentSection>
          ) },
          { id: "loans", label: "Loan Applications", content: (
            <ContentSection><AdminDataTable label="Customer loan applications" columns={loanColumns} data={customer.loans} pageSize={6} minWidth={820} emptyState="This customer has no loan applications." rowActions={(loan) => <Button size="sm" variant="outline" className="min-h-11 md:min-h-8" onPress={() => router.push(`/admin/loan-applications/${loan.detailId}`)}>Review Loan</Button>} /></ContentSection>
          ) },
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
              {previewing ? <DetailList columns={2} items={[{ label: "Loan reference", value: previewing.loanReference }, { label: "Uploaded", value: `${dateTime(previewing.uploadedAt)} ICT` }, { label: "Verification", value: <AdminStatusBadge status={previewing.status} /> }]} /> : null}
            </Drawer.Body>
            <Drawer.Footer><Button variant="primary" className="min-h-11" onPress={() => previewing && router.push(`/admin/documents/${previewing.detailId}`)}>Open Document Review</Button></Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </AdminPage>
  );
}
