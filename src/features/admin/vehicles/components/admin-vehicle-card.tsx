"use client";

import { GasPumpIcon, GearIcon, MapPinIcon, SpeedometerIcon, UsersIcon } from "@phosphor-icons/react";
import type { Vehicle } from "../types/vehicle";
import { MoneyDisplay } from "@/components/admin/data-display/misc";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { VehicleActions } from "./vehicle-actions";
import { VehiclePhoto } from "@/components/admin/vehicles/vehicle-photo";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

export function AdminVehicleCard({ vehicle, onView, onEdit, onToggle }: { vehicle: Vehicle; onView: () => void; onEdit: () => void; onToggle: () => void }) {
  const t = useAdminTranslations();
  const specs = [
    vehicle.engineCc ? { Icon: SpeedometerIcon, label: t("vehicles.card.cc", { count: vehicle.engineCc }) } : null,
    vehicle.transmission ? { Icon: GearIcon, label: vehicle.transmission } : null,
    vehicle.fuelType ? { Icon: GasPumpIcon, label: vehicle.fuelType } : null,
    vehicle.seats ? { Icon: UsersIcon, label: t("vehicles.card.seats", { count: vehicle.seats }) } : null,
  ].filter((spec): spec is { Icon: typeof GearIcon; label: string } => spec !== null);

  return (
    <article className="adminSurface adminLift group relative overflow-hidden rounded-2xl">
      <div className="relative">
        <button type="button" onClick={onView} aria-label={t("vehicles.card.view", { name: vehicle.name })} className="block w-full outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--admin-accent-strong)]">
          <VehiclePhoto vehicle={vehicle} className="aspect-[16/10] w-full transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none" sizes="(min-width: 1536px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
        </button>
        <span className="pointer-events-none absolute left-3 top-3"><AdminStatusBadge status={vehicle.status} className="shadow-sm" /></span>
        <span className="absolute right-1.5 top-1.5 rounded-full bg-white/85 backdrop-blur"><VehicleActions vehicle={vehicle} onView={onView} onEdit={onEdit} onToggle={onToggle} /></span>
      </div>
      <div className="space-y-3 p-4">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-extrabold leading-tight">{vehicle.name}</h3>
          <p className="mt-0.5 truncate text-xs text-[var(--admin-muted)]">{vehicle.category.toLowerCase() === vehicle.vehicleType ? t(`vehicles.types.${vehicle.vehicleType}`) : `${t(`vehicles.types.${vehicle.vehicleType}`)} · ${vehicle.category}`}</p>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-[var(--admin-muted)]"><MapPinIcon size={14} className="shrink-0" aria-hidden /><span className="truncate">{vehicle.location.name}</span></p>
        {specs.length ? <ul className="flex flex-wrap gap-1.5">{specs.slice(0, 3).map(({ Icon, label }) => <li key={label} className="adminTile inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold"><Icon size={12} aria-hidden />{label}</li>)}</ul> : null}
        <div className="flex items-end justify-between gap-3 border-t border-[var(--admin-border)] pt-3">
          <p className="text-xs text-[var(--admin-muted)]">{vehicle.registrationNumber}</p>
          <p className="text-right"><MoneyDisplay amount={vehicle.dailyRentalPriceMinor} className="text-lg font-extrabold" /><span className="ml-1 text-xs text-[var(--admin-muted)]">{t("vehicles.card.perDay")}</span></p>
        </div>
      </div>
    </article>
  );
}
