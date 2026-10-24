"use client";

import { Button, Dropdown, Label } from "@heroui/react";
import { CalendarCheckIcon, DotsThreeVerticalIcon, EnvelopeSimpleIcon, EyeIcon, HandCoinsIcon, MapPinIcon, NotePencilIcon, PhoneIcon } from "@phosphor-icons/react";
import { formatCambodiaDate } from "@/components/admin/controls";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import type { CustomerSummary } from "../types/customer";

export function CustomerActions({ customer, onView, onEdit, className }: { customer: Pick<CustomerSummary, "name">; onView: () => void; onEdit: () => void; className?: string }) {
  return (
    <Dropdown>
      <Button isIconOnly size="sm" variant="ghost" aria-label={`Actions for ${customer.name}`} className={`size-11 min-w-11 md:size-9 md:min-w-9 ${className ?? ""}`}><DotsThreeVerticalIcon size={20} weight="bold" /></Button>
      <Dropdown.Popover className="adminOverlay">
        <Dropdown.Menu aria-label={`Actions for ${customer.name}`}>
          <Dropdown.Item id="view" textValue="View customer" onAction={onView}><EyeIcon size={16} /><Label>View customer</Label></Dropdown.Item>
          <Dropdown.Item id="edit" textValue="Edit profile" onAction={onEdit}><NotePencilIcon size={16} /><Label>Edit profile</Label></Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

export function AdminCustomerCard({ customer, onView, onEdit }: { customer: CustomerSummary; onView: () => void; onEdit: () => void }) {
  return (
    <article className="adminSurface adminLift relative flex flex-col gap-3 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <CustomerAvatar name={customer.name} size="md" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-extrabold leading-tight">{customer.name}</h3>
          <p className="mt-0.5 text-xs text-[var(--admin-muted)]">{customer.reference}</p>
        </div>
        <AdminStatusBadge status={customer.status} />
        <CustomerActions customer={customer} onView={onView} onEdit={onEdit} className="-mr-2 -mt-1.5" />
      </div>
      <ul className="space-y-1.5 text-xs text-[var(--admin-muted)]">
        <li className="flex items-center gap-2"><EnvelopeSimpleIcon size={14} className="shrink-0" aria-hidden /><span className="truncate">{customer.email ?? "No email"}</span></li>
        <li className="flex items-center gap-2"><PhoneIcon size={14} className="shrink-0" aria-hidden />{customer.phone ?? "No phone"}</li>
        <li className="flex items-center gap-2"><MapPinIcon size={14} className="shrink-0" aria-hidden />{customer.city ?? "No city"} · joined {formatCambodiaDate(customer.createdAt, { day: "2-digit", month: "short", year: "numeric" })}</li>
      </ul>
      <dl className="grid grid-cols-2 gap-2">
        <div className="adminTile flex items-center gap-2 rounded-xl p-2.5"><CalendarCheckIcon size={16} className="text-[var(--admin-info)]" aria-hidden /><div><dt className="text-[11px] text-[var(--admin-muted)]">Bookings</dt><dd className="text-sm font-extrabold">{customer.bookingCount}</dd></div></div>
        <div className="adminTile flex items-center gap-2 rounded-xl p-2.5"><HandCoinsIcon size={16} className="text-[var(--admin-warning)]" aria-hidden /><div><dt className="text-[11px] text-[var(--admin-muted)]">Loans</dt><dd className="text-sm font-extrabold">{customer.loanCount}</dd></div></div>
      </dl>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--admin-border)] pt-3">
        {customer.activeRentals ? <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--admin-info)]"><span className="size-2 rounded-full bg-[var(--admin-info)]" aria-hidden />{customer.activeRentals} active rental{customer.activeRentals === 1 ? "" : "s"}</span> : <span className="text-xs text-[var(--admin-muted)]">No active rental</span>}
        <Button size="sm" variant="outline" className="min-h-11 md:min-h-9" onPress={onView}>View Details</Button>
      </div>
    </article>
  );
}
