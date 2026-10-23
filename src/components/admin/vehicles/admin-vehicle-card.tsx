"use client";

import { Button, Dropdown, Label } from "@heroui/react";
import { CarProfileIcon, DotsThreeVerticalIcon, EyeIcon, NotePencilIcon, PowerIcon } from "@phosphor-icons/react";
import Image from "next/image";
import type { AdminVehicle } from "@/components/admin/data";
import { MoneyDisplay } from "@/components/admin/data-display/misc";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";

export function AdminVehicleCard({ vehicle, onView, onEdit, onToggle }: { vehicle: AdminVehicle; onView: () => void; onEdit: () => void; onToggle: () => void }) {
  const image = vehicle.images[0];
  return <article className="group overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-white shadow-[0_1px_2px_rgb(15_23_42/4%)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0">
    <button type="button" onClick={onView} className="block w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent-strong)] focus-visible:ring-inset">
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--admin-surface-muted)]">
        {image?.url ? <Image src={image.url} alt={image.altText ?? vehicle.name} fill className="object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none" /> : <div className="flex size-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[var(--admin-surface-muted)] to-[#e9ecef] text-[var(--admin-muted)]"><CarProfileIcon size={38} weight="duotone" /><span className="text-xs font-semibold">Vehicle image pending</span></div>}
        <span className="absolute left-3 top-3"><AdminStatusBadge status={vehicle.status} /></span>
      </div>
    </button>
    <div className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-sm font-extrabold">{vehicle.name}</h3><p className="mt-0.5 truncate text-xs text-[var(--admin-muted)]">{vehicle.brand} {vehicle.model} · <span className="capitalize">{vehicle.vehicleType} · {vehicle.category}</span></p></div><Dropdown><Button isIconOnly size="sm" variant="ghost" aria-label={`More actions for ${vehicle.name}`}><DotsThreeVerticalIcon size={18} /></Button><Dropdown.Popover className="adminOverlay"><Dropdown.Menu aria-label={`Actions for ${vehicle.name}`} onAction={(key) => { if (key === "view") onView(); if (key === "edit") onEdit(); if (key === "toggle") onToggle(); }}><Dropdown.Item id="view" textValue="View vehicle"><EyeIcon size={16} /><Label>View vehicle</Label></Dropdown.Item><Dropdown.Item id="edit" textValue="Edit vehicle"><NotePencilIcon size={16} /><Label>Edit vehicle</Label></Dropdown.Item><Dropdown.Item id="toggle" textValue={vehicle.status === "inactive" ? "Activate vehicle" : "Deactivate vehicle"} variant={vehicle.status === "inactive" ? "default" : "danger"}><PowerIcon size={16} /><Label>{vehicle.status === "inactive" ? "Activate vehicle" : "Deactivate vehicle"}</Label></Dropdown.Item></Dropdown.Menu></Dropdown.Popover></Dropdown></div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs"><div><dt className="text-[var(--admin-muted)]">Location</dt><dd className="mt-0.5 truncate font-semibold">{vehicle.location.city}</dd></div><div><dt className="text-[var(--admin-muted)]">Registration</dt><dd className="mt-0.5 truncate font-semibold">{vehicle.registrationNumber}</dd></div><div><dt className="text-[var(--admin-muted)]">Daily rate</dt><dd className="mt-0.5 font-bold"><MoneyDisplay amount={vehicle.dailyRentalPriceMinor} /></dd></div><div><dt className="text-[var(--admin-muted)]">Currency</dt><dd className="mt-0.5 font-semibold">USD</dd></div></dl>
      <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-[var(--admin-border)] pt-3 text-[11px] text-[var(--admin-muted)]"><span>{vehicle.engineCc ? `${vehicle.engineCc} cc` : "Engine —"}</span><span>{vehicle.transmission || "Transmission —"}</span>{vehicle.seats ? <span>{vehicle.seats} seats</span> : null}</div>
      <Button fullWidth size="sm" variant="outline" onPress={onView}><EyeIcon size={16} />View details</Button>
    </div>
  </article>;
}
