"use client";

import { Button, Input, Label, TextField } from "@heroui/react";
import type { ColumnDef } from "@tanstack/react-table";
import { BuildingsIcon, CalendarCheckIcon, CurrencyDollarIcon, DotsThreeIcon, PlusIcon, UsersIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { AdminSearch, AdminSelect, CambodiaDateFilter, FilterBar, TableActions } from "@/components/admin/controls";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { ActivityTimeline, AvatarCell, MoneyDisplay } from "@/components/admin/data-display/misc";
import { StatCard } from "@/components/admin/data-display/stat-card";
import { AdminStatusBadge, adminStatusVariants, type AdminStatus } from "@/components/admin/data-display/status-badge";
import { AdminEmptyState, AdminErrorState, AdminLoadingState, AdminSuccessState, ConfirmationDialog } from "@/components/admin/feedback";
import { DocumentUploader } from "@/components/admin/forms/document-uploader";
import { FormGrid, FormSection } from "@/components/admin/forms/form-layout";
import { ImageUploader } from "@/components/admin/forms/image-uploader";
import { AdminPage, ContentSection, DetailList, InfoCard, PageHeader, SplitPanel } from "@/components/admin/layout";
import { AdminBreadcrumbs, AdminTabs } from "@/components/admin/navigation";

type DemoBooking = { id: string; customer: string; phone: string; vehicle: string; location: string; amount: number; status: AdminStatus };
const bookings: DemoBooking[] = [
  { id: "BND0124", customer: "John Smith", phone: "+855 12 345 678", vehicle: "Toyota Vios", location: "Phnom Penh", amount: 4500, status: "ongoing" },
  { id: "BND0123", customer: "Marie Tan", phone: "+855 93 456 789", vehicle: "Honda Click 125", location: "Siem Reap", amount: 2800, status: "completed" },
  { id: "BND0122", customer: "David Kim", phone: "+855 11 572 654", vehicle: "Yamaha NMAX", location: "Phnom Penh", amount: 5200, status: "pending" },
  { id: "BND0121", customer: "Sarah Wong", phone: "+855 12 722 333", vehicle: "KTM Duke 250", location: "Sihanoukville", amount: 3200, status: "cancelled" },
  { id: "BND0120", customer: "Chan Dara", phone: "+855 96 111 222", vehicle: "Suzuki Burgman", location: "Siem Reap", amount: 3600, status: "confirmed" },
  { id: "BND0119", customer: "Sok Pisey", phone: "+855 77 555 100", vehicle: "Honda PCX 160", location: "Phnom Penh", amount: 4100, status: "no-show" },
  { id: "BND0118", customer: "Maly Chenda", phone: "+855 98 200 300", vehicle: "Toyota Fortuner", location: "Phnom Penh", amount: 9800, status: "completed" },
];

const columns: ColumnDef<DemoBooking>[] = [
  { accessorKey: "id", header: "Booking" },
  { accessorKey: "customer", header: "Customer", cell: ({ row }) => <AvatarCell name={row.original.customer} detail={row.original.phone} /> },
  { accessorKey: "vehicle", header: "Vehicle" },
  { accessorKey: "location", header: "Location" },
  { accessorKey: "amount", header: "Amount", cell: ({ getValue }) => <MoneyDisplay amount={getValue<number>()} /> },
  { accessorKey: "status", header: "Status", cell: ({ getValue }) => <AdminStatusBadge status={getValue<AdminStatus>()} /> },
];

function AdminTextField({ label, defaultValue }: { label: string; defaultValue?: string }) {
  return <TextField defaultValue={defaultValue}><Label className="mb-1 block text-xs font-bold">{label}</Label><Input fullWidth /></TextField>;
}

export function AdminUiShowcase() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [location, setLocation] = useState("all");
  const [dates, setDates] = useState({ start: "2026-10-01", end: "2026-10-31" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const filtered = useMemo(() => bookings.filter((booking) => (status === "all" || booking.status === status) && (location === "all" || booking.location === location) && `${booking.id} ${booking.customer} ${booking.vehicle}`.toLowerCase().includes(query.toLowerCase())), [query, status, location]);

  return <AdminPage>
    <AdminBreadcrumbs items={[{ label: "UI foundation" }]} />
    <PageHeader eyebrow="Internal showcase" title="Admin UI foundation" description="Reusable operations primitives with Cambodia-focused mock data. This route is intentionally absent from the sidebar." actions={<><Button variant="outline">Export</Button><Button><PlusIcon size={17} />Add vehicle</Button></>} />

    <section aria-label="Statistics" className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      <StatCard label="Total bookings" value="124" icon={<CalendarCheckIcon size={19} />} trend={{ direction: "up", value: "12.4%" }} />
      <StatCard label="Active rentals" value="36" icon={<BuildingsIcon size={19} />} trend={{ direction: "up", value: "8.1%" }} />
      <StatCard label="Total revenue" value={<MoneyDisplay amount={12545000} />} icon={<CurrencyDollarIcon size={19} />} secondary="October 2026 · USD" />
      <StatCard label="Customers" value="1,284" icon={<UsersIcon size={19} />} loading />
    </section>

    <ContentSection title="Bookings table" description="Sortable columns, filters, local pagination and contained horizontal scrolling.">
      <FilterBar search={<AdminSearch value={query} onChange={setQuery} placeholder="Search bookings…" />}>
        <AdminSelect label="Status" value={status} onChange={setStatus} options={[{ value: "all", label: "All statuses" }, { value: "ongoing", label: "Ongoing" }, { value: "completed", label: "Completed" }, { value: "pending", label: "Pending" }]} />
        <AdminSelect label="Location" value={location} onChange={setLocation} options={[{ value: "all", label: "All locations" }, { value: "Phnom Penh", label: "Phnom Penh" }, { value: "Siem Reap", label: "Siem Reap" }, { value: "Sihanoukville", label: "Sihanoukville" }]} />
        <CambodiaDateFilter value={dates} onChange={setDates} />
      </FilterBar>
      <AdminDataTable label="Cambodia bookings" columns={columns} data={filtered} pageSize={4} rowActions={(row) => <TableActions><Button isIconOnly size="sm" variant="ghost" aria-label={`Actions for ${row.id}`}><DotsThreeIcon size={18} /></Button></TableActions>} onRowNavigate={() => undefined} />
    </ContentSection>

    <ContentSection title="Status and money" description="A unified status vocabulary and minor-unit money formatting.">
      <div className="space-y-5 p-5"><div className="flex flex-wrap gap-2">{adminStatusVariants.map((variant) => <AdminStatusBadge key={variant} status={variant} />)}</div><div className="flex flex-wrap items-center gap-5 text-sm"><span>USD cents: <MoneyDisplay amount={125099} /></span><span>KHR riel: <MoneyDisplay amount={4100000} currency="KHR" /></span></div></div>
    </ContentSection>

    <SplitPanel primary={<ContentSection title="Form layout"><div className="space-y-6 p-5"><FormSection title="Basic information" description="Fields retain readable widths across the workspace."><FormGrid columns={2}><AdminTextField label="Vehicle name" defaultValue="Honda Click 125" /><AdminTextField label="Registration number" defaultValue="1AA-1234" /><AdminTextField label="Location" defaultValue="Phnom Penh" /><AdminTextField label="Daily price (USD cents)" defaultValue="1200" /></FormGrid></FormSection><ImageUploader /><DocumentUploader /></div></ContentSection>} secondary={<div className="space-y-5"><InfoCard title="Vehicle details"><DetailList items={[{ label: "Type", value: "Motorcycle" }, { label: "Transmission", value: "Automatic" }, { label: "Fuel", value: "Petrol" }, { label: "Seats", value: "2" }]} columns={2} /></InfoCard><InfoCard title="Application timeline"><ActivityTimeline items={[{ id: "1", title: "Application submitted", detail: "Dara submitted the loan request.", time: "10 Oct 2026, 10:30 ICT", tone: "info" }, { id: "2", title: "Documents verified", time: "12 Oct 2026, 14:15 ICT", tone: "success" }, { id: "3", title: "Under review", time: "Today, 09:40 ICT", tone: "warning" }]} /></InfoCard></div>} />

    <ContentSection title="Navigation and feedback"><div className="space-y-6 p-5"><AdminTabs label="Customer record" items={[{ id: "overview", label: "Overview", content: <p className="text-sm text-[var(--admin-muted)]">Personal details and account summary.</p> }, { id: "bookings", label: "Bookings", content: <p className="text-sm text-[var(--admin-muted)]">Customer booking history.</p> }, { id: "documents", label: "Documents", content: <p className="text-sm text-[var(--admin-muted)]">Identity and licence records.</p> }]} /><div className="grid gap-4 lg:grid-cols-3"><div className="rounded-xl border border-[var(--admin-border)]"><AdminLoadingState /></div><div className="rounded-xl border border-[var(--admin-border)]"><AdminEmptyState /></div><div className="rounded-xl border border-[var(--admin-border)]"><AdminErrorState onRetry={() => undefined} /></div></div><AdminSuccessState title="Changes saved" description="The vehicle record was updated." /><Button variant="danger" onPress={() => setConfirmOpen(true)}>Open confirmation dialog</Button></div></ContentSection>
    <ConfirmationDialog isOpen={confirmOpen} onOpenChange={setConfirmOpen} title="Remove this document?" description="The local preview will be removed. This showcase does not upload or delete server data." confirmLabel="Remove document" danger onConfirm={() => undefined} />
  </AdminPage>;
}
