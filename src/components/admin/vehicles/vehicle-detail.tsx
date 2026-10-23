"use client";

import { Button } from "@heroui/react";
import { CarProfileIcon, MapPinIcon, NotePencilIcon, PowerIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminVehicles } from "@/components/admin/data";
import { MoneyDisplay } from "@/components/admin/data-display/misc";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { AdminErrorState, ConfirmationDialog } from "@/components/admin/feedback";
import { AdminPage, DetailList, InfoCard, PageHeader } from "@/components/admin/layout";
import { AvailabilityBlocks } from "@/components/admin/vehicles/availability-blocks";

export function VehicleDetail({ id }: { id: string }) {
  const router = useRouter();
  const initialVehicle = adminVehicles.find((item) => item.id === id);
  const [vehicle, setVehicle] = useState(initialVehicle);
  const [confirming, setConfirming] = useState(false);

  if (!vehicle) return <AdminPage><PageHeader title="Vehicle Details" /><AdminErrorState title="Vehicle not found" description="This UI preview does not contain that vehicle." /></AdminPage>;
  function toggle() { setVehicle((current) => current ? { ...current, status: current.status === "inactive" ? "available" : "inactive" } : current); setConfirming(false); }
  const image = vehicle.images[0];
  return <AdminPage>
    <PageHeader eyebrow="Vehicles" title={vehicle.name} description={`${vehicle.brand} ${vehicle.model}`} actions={<><Button onPress={() => router.push(`/admin/vehicles/${id}/edit`)} variant="outline"><NotePencilIcon />Edit</Button><Button variant={vehicle.status === "inactive" ? "primary" : "danger"} onPress={() => setConfirming(true)}><PowerIcon />{vehicle.status === "inactive" ? "Reactivate" : "Deactivate"}</Button></>} />
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
      <InfoCard title="Vehicle gallery"><div className="relative aspect-[4/3] max-h-[420px] overflow-hidden rounded-xl bg-[var(--admin-surface-muted)]">{image?.url ? <Image src={image.url} alt={image.altText ?? vehicle.name} fill className="object-cover" sizes="(min-width: 1280px) 60vw, 100vw" /> : <div className="flex size-full flex-col items-center justify-center gap-2 text-[var(--admin-muted)]"><CarProfileIcon size={42} weight="duotone" /><span className="text-sm font-semibold">No stored images</span></div>}<span className="absolute left-3 top-3"><AdminStatusBadge status={vehicle.status} /></span></div>{vehicle.images.length > 1 ? <div className="mt-3 grid grid-cols-4 gap-2">{vehicle.images.slice(1, 5).map((item) => <div key={item.id} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[var(--admin-surface-muted)]">{item.url ? <Image src={item.url} alt={item.altText ?? vehicle.name} fill className="object-cover" sizes="120px" /> : null}</div>)}</div> : null}</InfoCard>
      <div className="space-y-5"><InfoCard title="Overview"><DetailList items={[{ label: "Type / category", value: <span className="capitalize">{vehicle.vehicleType} · {vehicle.category}</span> }, { label: "Brand / model", value: `${vehicle.brand} ${vehicle.model}` }, { label: "Registration", value: vehicle.registrationNumber }, { label: "Location", value: <span className="inline-flex items-center gap-1"><MapPinIcon size={14} className="text-[var(--admin-muted)]" />{vehicle.location.name}, {vehicle.location.city}</span> }]} /></InfoCard><InfoCard title="Pricing"><DetailList columns={2} items={[{ label: "Daily rate", value: <MoneyDisplay amount={vehicle.dailyRentalPriceMinor} /> }, { label: "Security deposit", value: <MoneyDisplay amount={vehicle.securityDepositMinor} /> }]} /></InfoCard><InfoCard title="Specifications"><DetailList columns={2} items={[{ label: "Engine", value: vehicle.engineCc ? `${vehicle.engineCc} cc` : "—" }, { label: "Transmission", value: vehicle.transmission || "—" }, { label: "Fuel type", value: vehicle.fuelType || "—" }, { label: "Seats", value: vehicle.seats ?? "—" }]} /></InfoCard></div>
    </div>
    <InfoCard title="Description"><p className="text-sm leading-6 text-[var(--admin-muted)]">{vehicle.description || "No description has been added."}</p></InfoCard>
    <AvailabilityBlocks vehicleId={vehicle.id} />
    <ConfirmationDialog isOpen={confirming} onOpenChange={setConfirming} title={vehicle.status === "inactive" ? "Reactivate vehicle?" : "Deactivate vehicle?"} description={vehicle.status === "inactive" ? "This vehicle will be available for bookings again." : "This vehicle will be removed from the active catalogue."} confirmLabel={vehicle.status === "inactive" ? "Reactivate" : "Deactivate"} danger={vehicle.status !== "inactive"} onConfirm={toggle} />
  </AdminPage>;
}
