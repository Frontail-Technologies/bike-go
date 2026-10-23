"use client";

import { Alert, Button, Input, Label, Switch, TextField } from "@heroui/react";
import { CheckCircleIcon, EyeIcon, FloppyDiskIcon, XCircleIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AdminSearch, AdminSelect, FilterBar, formatCambodiaDate } from "@/components/admin/controls";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { AvatarCell } from "@/components/admin/data-display/misc";
import { AdminStatusBadge, type AdminStatus } from "@/components/admin/data-display/status-badge";
import { AdminErrorState } from "@/components/admin/feedback";
import { FormGrid, FormSection } from "@/components/admin/forms/form-layout";
import { AdminPage, ContentSection, DetailList, InfoCard, PageHeader } from "@/components/admin/layout";

const PAGE_SIZE = 6;
const all = "all";

function ViewAction({ label, onPress }: { label: string; onPress: () => void }) {
  return <Button isIconOnly size="sm" variant="ghost" aria-label={label} onPress={onPress}><EyeIcon size={17} /></Button>;
}

function ListFrame<T extends { id: string }>({ title, description, search, setSearch, status, setStatus, statusOptions, columns, rows, total, page, setPage, empty }: { title: string; description: string; search: string; setSearch: (value: string) => void; status: string; setStatus: (value: string) => void; statusOptions: string[]; columns: ColumnDef<T>[]; rows: T[]; total: number; page: number; setPage: (page: number) => void; empty: string }) {
  return <AdminPage><PageHeader title={title} description={description} /><ContentSection><FilterBar search={<AdminSearch className="sm:max-w-md" value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder={`Search ${title.toLowerCase()}…`} />}><AdminSelect label="All statuses" value={status} onChange={(value) => { setStatus(value); setPage(1); }} options={[{ value: all, label: "All statuses" }, ...statusOptions.map((value) => ({ value, label: value.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ") }))]} />{search || status !== all ? <Button size="sm" variant="ghost" onPress={() => { setSearch(""); setStatus(all); setPage(1); }}>Reset filters</Button> : null}</FilterBar><AdminDataTable columns={columns} data={rows} label={title} emptyState={empty} pagination={{ page, pageSize: PAGE_SIZE, total, onPageChange: setPage }} /></ContentSection></AdminPage>;
}

function RecordNotFound({ title }: { title: string }) { return <AdminPage><PageHeader title={title} /><AdminErrorState title="Record not found" description="This UI preview does not contain that record." /></AdminPage>; }

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
