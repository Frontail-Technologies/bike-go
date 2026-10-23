"use client";

import { Button } from "@heroui/react";
import { NotePencilIcon, PowerIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminVehicles } from "@/components/admin/data";
import { MoneyDisplay } from "@/components/admin/data-display/misc";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { AdminErrorState, ConfirmationDialog } from "@/components/admin/feedback";
import { AdminPage, DetailList, InfoCard, PageHeader, SplitPanel } from "@/components/admin/layout";
import { AvailabilityBlocks } from "@/components/admin/vehicles/availability-blocks";

export function VehicleDetail({ id }: { id: string }) {
  const router = useRouter();
  const initialVehicle = adminVehicles.find((item) => item.id === id);
  const [vehicle, setVehicle] = useState(initialVehicle);
  const [confirming, setConfirming] = useState(false);
  async function toggle() {
    if (!vehicle) return;
    setVehicle({ ...vehicle, status: vehicle.status === "inactive" ? "available" : "inactive" });
    setConfirming(false);
  }
  if (!vehicle) return <AdminPage><PageHeader title="Vehicle Details" /><AdminErrorState title="Vehicle not found" description="This UI preview does not contain that vehicle." /></AdminPage>;
  const image = vehicle.images[0]?.url;
  return <AdminPage>
    <PageHeader eyebrow="Vehicles" title={vehicle.name} description={`${vehicle.brand} ${vehicle.model}`} actions={<><Button onPress={() => router.push(`/admin/vehicles/${id}/edit`)} variant="outline"><NotePencilIcon />Edit</Button><Button variant={vehicle.status === "inactive" ? "primary" : "danger"} onPress={() => setConfirming(true)}><PowerIcon />{vehicle.status === "inactive" ? "Reactivate" : "Deactivate"}</Button></>} />
    <SplitPanel primary={<div className="space-y-5"><InfoCard title="Vehicle gallery"><div className="aspect-[16/9] overflow-hidden rounded-xl bg-[var(--admin-surface-muted)]">{image ? <div role="img" aria-label={vehicle.images[0]?.altText ?? vehicle.name} className="size-full bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(image).slice(1, -1)})` }} /> : <div className="flex size-full items-center justify-center text-sm font-semibold text-[var(--admin-muted)]">No stored images</div>}</div>{vehicle.images.length > 1 ? <div className="mt-3 grid grid-cols-4 gap-2">{vehicle.images.slice(1).map((item) => <div key={item.id} role="img" aria-label={item.altText ?? vehicle.name} className="aspect-[4/3] rounded-lg bg-[var(--admin-surface-muted)] bg-cover bg-center" style={item.url ? { backgroundImage: `url(${JSON.stringify(item.url).slice(1, -1)})` } : undefined} />)}</div> : null}</InfoCard><InfoCard title="Description"><p className="text-sm leading-6 text-[var(--admin-muted)]">{vehicle.description || "No description has been added."}</p></InfoCard></div>} secondary={<div className="space-y-5"><InfoCard title="Overview"><div className="mb-5"><AdminStatusBadge status={vehicle.status} /></div><DetailList items={[{ label: "Type / category", value: <span className="capitalize">{vehicle.vehicleType} · {vehicle.category}</span> }, { label: "Brand / model", value: `${vehicle.brand} ${vehicle.model}` }, { label: "Registration", value: vehicle.registrationNumber }, { label: "Location", value: `${vehicle.location.name}, ${vehicle.location.city}` }]} /></InfoCard><InfoCard title="Pricing & deposit"><DetailList items={[{ label: "Daily rate", value: <MoneyDisplay amount={vehicle.dailyRentalPriceMinor} /> }, { label: "Security deposit", value: <MoneyDisplay amount={vehicle.securityDepositMinor} /> }]} /></InfoCard><InfoCard title="Specifications"><DetailList columns={2} items={[{ label: "Engine", value: vehicle.engineCc ? `${vehicle.engineCc} cc` : "—" }, { label: "Transmission", value: vehicle.transmission || "—" }, { label: "Fuel type", value: vehicle.fuelType || "—" }, { label: "Seats", value: vehicle.seats ?? "—" }]} /></InfoCard></div>} />
    <ConfirmationDialog isOpen={confirming} onOpenChange={setConfirming} title={vehicle.status === "inactive" ? "Reactivate vehicle?" : "Deactivate vehicle?"} description={vehicle.status === "inactive" ? "This vehicle will be available for bookings again." : "This vehicle will be removed from the active catalogue."} confirmLabel={vehicle.status === "inactive" ? "Reactivate" : "Deactivate"} danger={vehicle.status !== "inactive"} onConfirm={() => void toggle()} />
    <AvailabilityBlocks vehicleId={vehicle.id} />
  </AdminPage>;
}
