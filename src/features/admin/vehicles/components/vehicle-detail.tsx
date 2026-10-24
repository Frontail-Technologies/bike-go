"use client";

import { Button } from "@heroui/react";
import { CaretLeftIcon, CaretRightIcon, GasPumpIcon, GearIcon, IdentificationCardIcon, MapPinIcon, NotePencilIcon, PowerIcon, SpeedometerIcon, TagIcon, UsersIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { MoneyDisplay } from "@/components/admin/data-display/misc";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { AdminErrorState, AdminLoadingState, ConfirmationDialog } from "@/components/admin/feedback";
import { AdminPage, ContentSection, PageHeader } from "@/components/admin/layout";
import { AdminBreadcrumbs } from "@/components/admin/navigation";
import { VehiclePhoto } from "@/components/admin/vehicles/vehicle-photo";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/error";
import { useVehicleMutations, useVehicleQuery } from "../hooks/use-vehicles";
import type { Vehicle } from "../types/vehicle";
import { AvailabilityBlocks } from "./availability-blocks";
import { cn } from "@/lib/cn";

function Gallery({ vehicle }: { vehicle: Vehicle }) {
  const count = Math.max(1, vehicle.images.length);
  const [selected, setSelected] = useState(0);
  const step = (direction: -1 | 1) => setSelected((current) => (current + direction + count) % count);
  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--admin-border)]">
        <VehiclePhoto key={selected} vehicle={vehicle} index={selected} priority sizes="(min-width: 1024px) 48vw, 100vw" className="adminReveal aspect-[4/3] w-full sm:aspect-[16/10]" />
        {count > 1 ? (
          <>
            <Button isIconOnly variant="ghost" aria-label="Previous image" onPress={() => step(-1)} className="absolute left-2 top-1/2 size-11 min-w-11 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur"><CaretLeftIcon size={18} weight="bold" /></Button>
            <Button isIconOnly variant="ghost" aria-label="Next image" onPress={() => step(1)} className="absolute right-2 top-1/2 size-11 min-w-11 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur"><CaretRightIcon size={18} weight="bold" /></Button>
          </>
        ) : null}
        <span className="absolute bottom-3 right-3 rounded-full bg-[#111820]/75 px-2.5 py-1 text-xs font-bold text-white backdrop-blur" aria-live="polite">{selected + 1} / {count}</span>
      </div>
      {count > 1 ? (
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-5" aria-label="Vehicle images">
          {Array.from({ length: count }, (_, index) => (
            <li key={index}>
              <button type="button" onClick={() => setSelected(index)} aria-label={`Show image ${index + 1}`} aria-current={index === selected} className={cn("block w-full overflow-hidden rounded-xl border-2 outline-none transition-[border-color,opacity] focus-visible:ring-2 focus-visible:ring-[var(--admin-accent-strong)]", index === selected ? "border-[var(--admin-accent)]" : "border-transparent opacity-70 hover:opacity-100")}>
                <VehiclePhoto vehicle={vehicle} index={index} sizes="120px" className="aspect-[4/3] w-full" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Tile({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="adminTile flex items-center gap-3 rounded-xl p-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--admin-warning)] shadow-sm">{icon}</span>
      <div className="min-w-0"><dt className="text-[11px] font-medium text-[var(--admin-muted)]">{label}</dt><dd className="truncate text-sm font-bold">{children}</dd></div>
    </div>
  );
}

export function VehicleDetail({ id }: { id: string }) {
  const router = useRouter();
  const query = useVehicleQuery(id);
  const mutations = useVehicleMutations();
  const [confirming, setConfirming] = useState(false);
  const vehicle = query.data;

  if (query.isError && !vehicle) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return <AdminPage><PageHeader title="Vehicle Details" /><AdminErrorState title={notFound ? "Vehicle not found" : "Couldn’t load the vehicle"} description={query.error instanceof ApiError ? query.error.message : "Try again in a moment."} onRetry={notFound ? undefined : () => void query.refetch()} /></AdminPage>;
  }
  if (!vehicle) return <AdminPage><PageHeader title="Vehicle Details" /><AdminLoadingState label="Loading vehicle…" /></AdminPage>;
  const inactive = vehicle.status === "inactive";
  async function toggle() {
    const next = inactive ? "available" : "inactive";
    try {
      await mutations.setStatus.mutateAsync({ id: vehicle!.id, status: next });
      toast.success(`${vehicle!.name} ${inactive ? "activated" : "deactivated"}`);
    } catch (error) {
      toast.danger(error instanceof ApiError ? error.message : "The status could not be changed.");
    }
    setConfirming(false);
  }
  const subtitle = [`${vehicle.brand} ${vehicle.model}`, vehicle.vehicleType, vehicle.category].filter((part, index, parts) => part.toLowerCase() !== vehicle.name.toLowerCase() && parts.findIndex((other) => other.toLowerCase() === part.toLowerCase()) === index).join(" · ");
  const specs = [
    { icon: <SpeedometerIcon size={18} />, label: "Engine", value: vehicle.engineCc ? `${vehicle.engineCc} cc` : "—" },
    { icon: <GearIcon size={18} />, label: "Transmission", value: vehicle.transmission || "—" },
    { icon: <GasPumpIcon size={18} />, label: "Fuel type", value: vehicle.fuelType || "—" },
    { icon: <UsersIcon size={18} />, label: "Seats", value: vehicle.seats ?? "—" },
  ];

  return <AdminPage className="gap-5">
    <AdminBreadcrumbs items={[{ label: "Vehicles", href: "/admin/vehicles" }, { label: vehicle.name }]} />

    <section aria-label="Vehicle overview" className="adminHero grid gap-5 rounded-3xl p-4 sm:p-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-7">
      <Gallery vehicle={vehicle} />
      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{vehicle.name}</h1>
            <AdminStatusBadge status={vehicle.status} />
          </div>
          <p className="text-sm capitalize text-[var(--admin-muted)]">{subtitle}</p>
          <ul className="flex flex-wrap gap-2 text-xs font-semibold">
            <li className="adminTile inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"><IdentificationCardIcon size={14} aria-hidden />{vehicle.registrationNumber}</li>
            <li className="adminTile inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"><MapPinIcon size={14} aria-hidden />{vehicle.location.name}, {vehicle.location.city}</li>
          </ul>
        </div>

        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[var(--admin-accent-soft)] p-4"><dt className="text-xs font-semibold text-[var(--admin-warning)]">Daily rate</dt><dd className="mt-1 text-2xl font-extrabold"><MoneyDisplay amount={vehicle.dailyRentalPriceMinor} /></dd></div>
          <div className="rounded-2xl bg-[var(--admin-success-soft)] p-4"><dt className="text-xs font-semibold text-[var(--admin-success)]">Security deposit</dt><dd className="mt-1 text-2xl font-extrabold"><MoneyDisplay amount={vehicle.securityDepositMinor} /></dd></div>
        </dl>

        <dl className="grid grid-cols-2 gap-2.5">{specs.map((spec) => <Tile key={spec.label} icon={spec.icon} label={spec.label}>{spec.value}</Tile>)}</dl>

        <div className="mt-auto flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" className="min-h-11 sm:min-w-32" onPress={() => router.push(`/admin/vehicles/${id}/edit`)}><NotePencilIcon />Edit</Button>
          <Button variant={inactive ? "primary" : "danger"} className="min-h-11 sm:min-w-36" onPress={() => setConfirming(true)}><PowerIcon />{inactive ? "Activate" : "Deactivate"}</Button>
        </div>
      </div>
    </section>

    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
      <ContentSection title="Description"><p className="p-5 text-sm leading-6 text-[var(--admin-muted)]">{vehicle.description || "No description has been added."}</p></ContentSection>
      <ContentSection title="Pricing">
        <dl className="grid grid-cols-3 gap-3 p-5 text-sm xl:grid-cols-1">
          <div className="flex items-center justify-between gap-2 xl:border-b xl:border-[var(--admin-border)] xl:pb-3"><dt className="flex items-center gap-1.5 text-[var(--admin-muted)]"><TagIcon size={15} aria-hidden />Daily</dt><dd><MoneyDisplay amount={vehicle.dailyRentalPriceMinor} /></dd></div>
          <div className="flex items-center justify-between gap-2 xl:border-b xl:border-[var(--admin-border)] xl:pb-3"><dt className="text-[var(--admin-muted)]">7 days</dt><dd><MoneyDisplay amount={vehicle.dailyRentalPriceMinor * 7} /></dd></div>
          <div className="flex items-center justify-between gap-2"><dt className="text-[var(--admin-muted)]">Deposit</dt><dd><MoneyDisplay amount={vehicle.securityDepositMinor} /></dd></div>
        </dl>
      </ContentSection>
    </div>

    <AvailabilityBlocks vehicleId={vehicle.id} />
    <ConfirmationDialog isOpen={confirming} onOpenChange={setConfirming} title={inactive ? "Activate vehicle?" : "Deactivate vehicle?"} description={inactive ? "This vehicle will be available for bookings again." : "This vehicle will be removed from the active catalogue."} confirmLabel={inactive ? "Activate" : "Deactivate"} danger={!inactive} onConfirm={toggle} />
  </AdminPage>;
}
