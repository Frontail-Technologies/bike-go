"use client";

import { Alert, Button, Input, Label, Switch, TextField } from "@heroui/react";
import { CheckCircleIcon, EyeIcon, FloppyDiskIcon, XCircleIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AdminSearch, AdminSelect, CambodiaDateFilter, FilterBar, formatCambodiaDate } from "@/components/admin/controls";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { ActivityTimeline, AvatarCell, MoneyDisplay } from "@/components/admin/data-display/misc";
import { AdminStatusBadge, type AdminStatus } from "@/components/admin/data-display/status-badge";
import { AdminErrorState } from "@/components/admin/feedback";
import { FormGrid, FormSection } from "@/components/admin/forms/form-layout";
import { AdminPage, ContentSection, DetailList, InfoCard, PageHeader } from "@/components/admin/layout";
import { adminBookings, adminDocuments, adminLoans, adminPayments, type AdminBooking, type AdminDocument, type AdminLoan, type AdminPayment } from "./data";

const PAGE_SIZE = 6;
const all = "all";

function ViewAction({ label, onPress }: { label: string; onPress: () => void }) {
  return <Button isIconOnly size="sm" variant="ghost" aria-label={label} onPress={onPress}><EyeIcon size={17} /></Button>;
}

function ListFrame<T extends { id: string }>({ title, description, search, setSearch, status, setStatus, statusOptions, columns, rows, total, page, setPage, empty }: { title: string; description: string; search: string; setSearch: (value: string) => void; status: string; setStatus: (value: string) => void; statusOptions: string[]; columns: ColumnDef<T>[]; rows: T[]; total: number; page: number; setPage: (page: number) => void; empty: string }) {
  return <AdminPage><PageHeader title={title} description={description} /><ContentSection><FilterBar search={<AdminSearch className="sm:max-w-md" value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder={`Search ${title.toLowerCase()}…`} />}><AdminSelect label="All statuses" value={status} onChange={(value) => { setStatus(value); setPage(1); }} options={[{ value: all, label: "All statuses" }, ...statusOptions.map((value) => ({ value, label: value.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ") }))]} />{search || status !== all ? <Button size="sm" variant="ghost" onPress={() => { setSearch(""); setStatus(all); setPage(1); }}>Reset filters</Button> : null}</FilterBar><AdminDataTable columns={columns} data={rows} label={title} emptyState={empty} pagination={{ page, pageSize: PAGE_SIZE, total, onPageChange: setPage }} /></ContentSection></AdminPage>;
}

export function BookingsScreen() {
  const router = useRouter(); const [search, setSearch] = useState(""); const [status, setStatus] = useState(all); const [page, setPage] = useState(1);
  const filtered = useMemo(() => adminBookings.filter((item) => (!search || `${item.reference} ${item.customer} ${item.vehicle}`.toLowerCase().includes(search.toLowerCase())) && (status === all || item.status === status)), [search, status]);
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const columns: ColumnDef<AdminBooking>[] = [
    { accessorKey: "reference", header: "Booking", cell: ({ row }) => <div><p className="font-bold">{row.original.reference}</p><p className="text-xs text-[var(--admin-muted)]">{formatCambodiaDate(row.original.pickupAt)}</p></div> },
    { accessorKey: "customer", header: "Customer", cell: ({ row }) => <AvatarCell name={row.original.customer} detail={row.original.phone} /> },
    { accessorKey: "vehicle", header: "Vehicle", cell: ({ row }) => <div><p className="font-semibold">{row.original.vehicle}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.registration}</p></div> },
    { accessorKey: "location", header: "Pickup location" },
    { accessorKey: "totalMinor", header: "Amount", cell: ({ row }) => <MoneyDisplay amount={row.original.totalMinor} /> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <AdminStatusBadge status={row.original.status} /> },
    { id: "actions", header: "", enableSorting: false, cell: ({ row }) => <ViewAction label={`View booking ${row.original.reference}`} onPress={() => router.push(`/admin/bookings/${row.original.id}`)} /> },
  ];
  return <ListFrame title="Bookings" description="Review reservations, rental periods, payment state, and handover details." search={search} setSearch={setSearch} status={status} setStatus={setStatus} statusOptions={["pending", "confirmed", "ongoing", "completed", "cancelled", "no-show"]} columns={columns} rows={rows} total={filtered.length} page={page} setPage={setPage} empty="No bookings match these filters." />;
}

export function LoansScreen() {
  const router = useRouter(); const [search, setSearch] = useState(""); const [status, setStatus] = useState(all); const [page, setPage] = useState(1);
  const filtered = useMemo(() => adminLoans.filter((item) => (!search || `${item.reference} ${item.applicant} ${item.purpose}`.toLowerCase().includes(search.toLowerCase())) && (status === all || item.status === status)), [search, status]);
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const columns: ColumnDef<AdminLoan>[] = [
    { accessorKey: "reference", header: "Application", cell: ({ row }) => <div><p className="font-bold">{row.original.reference}</p><p className="text-xs text-[var(--admin-muted)]">{formatCambodiaDate(row.original.submittedAt)}</p></div> },
    { accessorKey: "applicant", header: "Applicant", cell: ({ row }) => <AvatarCell name={row.original.applicant} detail={row.original.occupation} /> },
    { accessorKey: "requestedMinor", header: "Requested", cell: ({ row }) => <MoneyDisplay amount={row.original.requestedMinor} /> },
    { accessorKey: "tenureMonths", header: "Tenure", cell: ({ row }) => `${row.original.tenureMonths} months` },
    { accessorKey: "purpose", header: "Purpose" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <AdminStatusBadge status={row.original.status} /> },
    { id: "actions", header: "", enableSorting: false, cell: ({ row }) => <ViewAction label={`View application ${row.original.reference}`} onPress={() => router.push(`/admin/loan-applications/${row.original.id}`)} /> },
  ];
  return <ListFrame title="Loan Applications" description="Review applicant information, requested amounts, and decision status." search={search} setSearch={setSearch} status={status} setStatus={setStatus} statusOptions={["pending", "under-review", "approved", "rejected"]} columns={columns} rows={rows} total={filtered.length} page={page} setPage={setPage} empty="No loan applications match these filters." />;
}

export function DocumentsScreen() {
  const router = useRouter(); const [search, setSearch] = useState(""); const [status, setStatus] = useState(all); const [page, setPage] = useState(1);
  const filtered = useMemo(() => adminDocuments.filter((item) => (!search || `${item.reference} ${item.customer} ${item.type} ${item.fileName}`.toLowerCase().includes(search.toLowerCase())) && (status === all || item.status === status)), [search, status]);
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const columns: ColumnDef<AdminDocument>[] = [
    { accessorKey: "reference", header: "Document", cell: ({ row }) => <div><p className="font-bold">{row.original.reference}</p><p className="text-xs text-[var(--admin-muted)]">{row.original.fileName}</p></div> },
    { accessorKey: "customer", header: "Customer", cell: ({ row }) => <AvatarCell name={row.original.customer} /> },
    { accessorKey: "type", header: "Type" }, { accessorKey: "uploadedAt", header: "Uploaded", cell: ({ row }) => formatCambodiaDate(row.original.uploadedAt) },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <AdminStatusBadge status={row.original.status} /> },
    { id: "actions", header: "", enableSorting: false, cell: ({ row }) => <ViewAction label={`Review document ${row.original.reference}`} onPress={() => router.push(`/admin/documents/${row.original.id}`)} /> },
  ];
  return <ListFrame title="Documents" description="Review identity and eligibility documents securely." search={search} setSearch={setSearch} status={status} setStatus={setStatus} statusOptions={["verified", "needs-review", "rejected", "expired"]} columns={columns} rows={rows} total={filtered.length} page={page} setPage={setPage} empty="No documents match these filters." />;
}

export function PaymentsScreen() {
  const [search, setSearch] = useState(""); const [status, setStatus] = useState(all); const [page, setPage] = useState(1); const [range, setRange] = useState({ start: "2026-10-01", end: "2026-10-31" });
  const filtered = useMemo(() => adminPayments.filter((item) => (!search || `${item.reference} ${item.bookingReference} ${item.customer}`.toLowerCase().includes(search.toLowerCase())) && (status === all || item.status === status)), [search, status]);
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const columns: ColumnDef<AdminPayment>[] = [
    { accessorKey: "reference", header: "Payment", cell: ({ row }) => <span className="font-bold">{row.original.reference}</span> }, { accessorKey: "bookingReference", header: "Booking" },
    { accessorKey: "customer", header: "Customer", cell: ({ row }) => <AvatarCell name={row.original.customer} /> },
    { accessorKey: "amountMinor", header: "Amount", cell: ({ row }) => <MoneyDisplay amount={row.original.amountMinor} /> }, { accessorKey: "method", header: "Method" },
    { accessorKey: "paidAt", header: "Date", cell: ({ row }) => formatCambodiaDate(row.original.paidAt) },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <AdminStatusBadge status={row.original.status} /> },
  ];
  return <AdminPage><PageHeader title="Payments" description="Track USD rental payments, refunds, and settlement status." /><ContentSection><FilterBar search={<AdminSearch className="sm:max-w-md" value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search payments…" />}><AdminSelect label="All statuses" value={status} onChange={(value) => { setStatus(value); setPage(1); }} options={[{ value: all, label: "All statuses" }, ...["paid", "pending", "partially-paid", "refunded", "failed"].map((value) => ({ value, label: value.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ") }))]} /><CambodiaDateFilter value={range} onChange={setRange} /></FilterBar><AdminDataTable columns={columns} data={rows} label="Payments" emptyState="No payments match these filters." pagination={{ page, pageSize: PAGE_SIZE, total: filtered.length, onPageChange: setPage }} /></ContentSection></AdminPage>;
}

function RecordNotFound({ title }: { title: string }) { return <AdminPage><PageHeader title={title} /><AdminErrorState title="Record not found" description="This UI preview does not contain that record." /></AdminPage>; }

export function BookingDetailScreen({ id }: { id: string }) {
  const item = adminBookings.find((booking) => booking.id === id); const [status, setStatus] = useState<AdminStatus | null>(item?.status ?? null);
  if (!item || !status) return <RecordNotFound title="Booking Details" />;
  return <AdminPage><PageHeader eyebrow="Bookings" title={item.reference} description="Booking and handover overview" actions={<><AdminStatusBadge status={status} /><Button variant="primary" onPress={() => setStatus(status === "completed" ? "ongoing" : "completed")}>Update status</Button></>} /><div className="grid gap-5 xl:grid-cols-3"><InfoCard title="Customer"><div className="mb-4"><p className="text-sm font-bold">{item.customer}</p><p className="text-xs text-[var(--admin-muted)]">{item.email}</p></div><DetailList items={[{ label: "Phone", value: item.phone }]} /></InfoCard><InfoCard title="Vehicle"><DetailList items={[{ label: "Vehicle", value: item.vehicle }, { label: "Registration", value: item.registration }, { label: "Pickup location", value: item.location }]} /></InfoCard><InfoCard title="Payment"><DetailList items={[{ label: "Rental", value: <MoneyDisplay amount={item.rentalMinor} /> }, { label: "Security deposit", value: <MoneyDisplay amount={item.depositMinor} /> }, { label: "Total", value: <MoneyDisplay amount={item.totalMinor} /> }, { label: "Status", value: <AdminStatusBadge status={item.paymentStatus} /> }]} /></InfoCard></div><InfoCard title="Booking schedule"><DetailList columns={2} items={[{ label: "Pickup — ICT", value: formatCambodiaDate(item.pickupAt, { hour: "2-digit", minute: "2-digit" }) }, { label: "Return — ICT", value: formatCambodiaDate(item.returnAt, { hour: "2-digit", minute: "2-digit" }) }]} /></InfoCard></AdminPage>;
}

export function LoanDetailScreen({ id }: { id: string }) {
  const item = adminLoans.find((loan) => loan.id === id); const [status, setStatus] = useState<AdminStatus | null>(item?.status ?? null); if (!item || !status) return <RecordNotFound title="Loan Application Details" />;
  return <AdminPage><PageHeader eyebrow="Loan Applications" title={item.reference} description={`Submitted ${formatCambodiaDate(item.submittedAt)}`} actions={<AdminStatusBadge status={status} />} /><div className="grid gap-5 xl:grid-cols-[1fr_1fr_0.8fr]"><InfoCard title="Applicant information"><AvatarCell name={item.applicant} detail={item.email} /><DetailList items={[{ label: "Phone", value: item.phone }, { label: "Occupation", value: item.occupation }, { label: "Employer", value: item.employer }, { label: "Monthly income", value: <MoneyDisplay amount={item.monthlyIncomeMinor} /> }]} /></InfoCard><InfoCard title="Loan details"><DetailList items={[{ label: "Requested amount", value: <MoneyDisplay amount={item.requestedMinor} /> }, { label: "Tenure", value: `${item.tenureMonths} months` }, { label: "Purpose", value: item.purpose }]} /><div className="mt-5 flex gap-2"><Button variant="danger" onPress={() => setStatus("rejected")}><XCircleIcon />Reject</Button><Button variant="primary" onPress={() => setStatus("approved")}><CheckCircleIcon />Approve</Button></div></InfoCard><InfoCard title="Application timeline"><ActivityTimeline items={[{ id: "1", title: "Application submitted", detail: item.applicant, time: formatCambodiaDate(item.submittedAt), tone: "info" }, { id: "2", title: status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Under review", detail: "Local UI decision state", time: "Current", tone: status === "approved" ? "success" : "warning" }]} /></InfoCard></div></AdminPage>;
}

export function DocumentDetailScreen({ id }: { id: string }) {
  const item = adminDocuments.find((document) => document.id === id); const [status, setStatus] = useState<AdminStatus | null>(item?.status ?? null); if (!item || !status) return <RecordNotFound title="Document Review" />;
  return <AdminPage><PageHeader eyebrow="Documents" title="Document Review" description={item.reference} /><div className="grid gap-5 xl:grid-cols-[0.8fr_1.25fr_0.8fr]"><InfoCard title="Document information"><DetailList items={[{ label: "Customer", value: item.customer }, { label: "Type", value: item.type }, { label: "File", value: item.fileName }, { label: "Uploaded", value: formatCambodiaDate(item.uploadedAt) }, { label: "Status", value: <AdminStatusBadge status={status} /> }]} /></InfoCard><InfoCard title="Secure preview"><div className="flex min-h-80 items-center justify-center rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-muted)] text-center"><div><p className="font-bold">Protected document preview</p><p className="mt-1 text-sm text-[var(--admin-muted)]">Preview content is intentionally unavailable in this UI-only build.</p></div></div></InfoCard><InfoCard title="Review actions"><p className="mb-4 text-sm text-[var(--admin-muted)]">Confirm that the document is readable, current, and matches the customer profile.</p><div className="grid gap-2"><Button variant="danger" onPress={() => setStatus("rejected")}><XCircleIcon />Reject</Button><Button variant="primary" onPress={() => setStatus("verified")}><CheckCircleIcon />Verify</Button></div></InfoCard></div></AdminPage>;
}

export function SettingsScreen() {
  const [saved, setSaved] = useState(false);
  const [pickup, setPickup] = useState(true);
  const [documents, setDocuments] = useState(true);
  const save = () => { setSaved(true); window.setTimeout(() => setSaved(false), 2500); };
  return <AdminPage>
    <PageHeader title="Settings" description="Configure the admin-facing RideGo workspace." actions={<Button variant="primary" onPress={save}><FloppyDiskIcon />Save changes</Button>} />
    {saved ? <Alert status="success"><Alert.Indicator /><Alert.Content><Alert.Title>Settings saved locally</Alert.Title><Alert.Description>This UI preview does not persist configuration.</Alert.Description></Alert.Content></Alert> : null}
    <div className="grid gap-5 xl:grid-cols-2">
      <ContentSection title="General settings"><div className="space-y-7 p-5"><FormSection title="Platform"><FormGrid><TextField defaultValue="RideGo"><Label>Platform name</Label><Input variant="secondary" /></TextField><TextField defaultValue="Asia/Phnom_Penh" isReadOnly><Label>Timezone</Label><Input variant="secondary" readOnly /></TextField><TextField defaultValue="USD" isReadOnly><Label>Default currency</Label><Input variant="secondary" readOnly /></TextField></FormGrid></FormSection><FormSection title="Business"><FormGrid><TextField defaultValue="RideGo Cambodia Co., Ltd."><Label>Business name</Label><Input variant="secondary" /></TextField><TextField defaultValue="support@ridego.com"><Label>Contact email</Label><Input variant="secondary" /></TextField><TextField defaultValue="+855 23 123 456"><Label>Contact phone</Label><Input variant="secondary" /></TextField></FormGrid></FormSection></div></ContentSection>
      <ContentSection title="Rental settings"><div className="space-y-6 p-5"><TextField defaultValue="200"><Label>Default security deposit (USD)</Label><Input type="number" variant="secondary" /></TextField><div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--admin-border)] p-4"><div><p className="text-sm font-bold">Require documents for booking</p><p className="text-xs text-[var(--admin-muted)]">Request valid identity and driving documents.</p></div><Switch isSelected={documents} onChange={setDocuments} aria-label="Require documents for booking"><Switch.Content><Switch.Control><Switch.Thumb /></Switch.Control></Switch.Content></Switch></div><div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--admin-border)] p-4"><div><p className="text-sm font-bold">Enable self pickup</p><p className="text-xs text-[var(--admin-muted)]">Allow customers to collect vehicles from a location.</p></div><Switch isSelected={pickup} onChange={setPickup} aria-label="Enable self pickup"><Switch.Content><Switch.Control><Switch.Thumb /></Switch.Control></Switch.Content></Switch></div></div></ContentSection>
    </div>
  </AdminPage>;
}
