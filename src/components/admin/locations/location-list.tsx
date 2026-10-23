"use client";

import { Button } from "@heroui/react";
import { MapPinIcon, NotePencilIcon, PlusIcon, PowerIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminLocations, type AdminLocation } from "@/components/admin/data";
import { AdminSearch } from "@/components/admin/controls";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { AdminEmptyState, ConfirmationDialog } from "@/components/admin/feedback";
import { AdminPage, DetailList, InfoCard, PageHeader } from "@/components/admin/layout";

export function LocationList() {
  const router = useRouter();
  const [items, setItems] = useState(adminLocations);
  const [search, setSearch] = useState("");
  const [changing, setChanging] = useState<AdminLocation | null>(null);
  const locations = items.filter((location) => `${location.name} ${location.city} ${location.address}`.toLowerCase().includes(search.trim().toLowerCase()));
  async function toggle() {
    if (!changing) return;
    setItems((current) => current.map((location) => location.id === changing.id ? { ...location, active: !location.active } : location));
    setChanging(null);
  }
  return <AdminPage>
    <PageHeader title="Locations" description="Manage Cambodia pickup and return locations." actions={<Button onPress={() => router.push("/admin/locations/new")} variant="primary"><PlusIcon />Add Location</Button>} />
    <div className="flex max-w-sm"><AdminSearch value={search} onChange={setSearch} placeholder="Search locations…" /></div>
    {locations.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{locations.map((location) => <InfoCard key={location.id} title={location.name} icon={<MapPinIcon size={18} />}><div className="mb-5 flex items-center justify-between gap-3"><p className="text-sm font-bold">{location.city}</p><AdminStatusBadge status={location.active ? "available" : "inactive"} /></div><DetailList items={[{ label: "Address", value: location.address }, { label: "Coordinates", value: location.latitude !== null && location.longitude !== null ? `${location.latitude}, ${location.longitude}` : "Not set" }]} /><div className="mt-5 flex gap-2 border-t border-[var(--admin-border)] pt-4"><Button onPress={() => router.push(`/admin/locations/${location.id}/edit`)} size="sm" variant="outline"><NotePencilIcon />Edit</Button><Button size="sm" variant="ghost" onPress={() => setChanging(location)}><PowerIcon />{location.active ? "Deactivate" : "Activate"}</Button></div></InfoCard>)}</div> : <AdminEmptyState title="No locations found" description="Try another search or add a RideGo location." />}
    <ConfirmationDialog isOpen={Boolean(changing)} onOpenChange={(open) => !open && setChanging(null)} title={changing?.active ? "Deactivate location?" : "Activate location?"} description={changing?.active ? `${changing.name} will not be available for new assignments.` : `${changing?.name ?? "This location"} will be available for vehicle assignment.`} confirmLabel={changing?.active ? "Deactivate" : "Activate"} danger={changing?.active} onConfirm={() => void toggle()} />
  </AdminPage>;
}
