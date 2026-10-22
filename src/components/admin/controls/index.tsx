"use client";

import { Button, SearchField } from "@heroui/react";
import { CaretLeftIcon, CaretRightIcon, FunnelIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function AdminSearch({ value, onChange, placeholder = "Search…", className }: { value: string; onChange: (value: string) => void; placeholder?: string; className?: string }) {
  return <SearchField value={value} onChange={onChange} aria-label={placeholder} className={cn("w-full sm:max-w-xs", className)}><SearchField.Group><SearchField.SearchIcon /><SearchField.Input placeholder={placeholder} /><SearchField.ClearButton /></SearchField.Group></SearchField>;
}

export function FilterBar({ children, search, actions, className }: { children?: ReactNode; search?: ReactNode; actions?: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 xl:flex-row xl:items-center", className)}>{search}<div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{children}</div>{actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}</div>;
}

export function AdminSelect({ label, value, onChange, options, className }: { label: string; value: string; onChange: (value: string) => void; options: ReadonlyArray<{ value: string; label: string }>; className?: string }) {
  return <label className={cn("relative flex min-h-10 items-center gap-2 rounded-xl border border-[var(--admin-border)] bg-white px-3 text-sm", className)}><FunnelIcon size={15} className="text-[var(--admin-muted)]" aria-hidden /><span className="sr-only">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="min-w-28 appearance-none bg-transparent pr-4 font-semibold outline-none">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

export type AdminDateRange = { start: string; end: string };
export function CambodiaDateFilter({ value, onChange }: { value: AdminDateRange; onChange: (range: AdminDateRange) => void }) {
  return <fieldset className="flex min-h-10 items-center gap-2 rounded-xl border border-[var(--admin-border)] bg-white px-3"><legend className="sr-only">Date range, Cambodia time</legend><input aria-label="Start date" type="date" value={value.start} onChange={(event) => onChange({ ...value, start: event.target.value })} className="bg-transparent text-xs font-semibold outline-none" /><span className="text-[var(--admin-muted)]">–</span><input aria-label="End date" type="date" value={value.end} onChange={(event) => onChange({ ...value, end: event.target.value })} className="bg-transparent text-xs font-semibold outline-none" /><span className="hidden text-[10px] text-[var(--admin-muted)] sm:inline">ICT</span></fieldset>;
}

export function TableActions({ children }: { children: ReactNode }) { return <div className="flex items-center justify-end gap-1">{children}</div>; }

export function AdminPagination({ page, pageCount, total, pageSize, onPageChange }: { page: number; pageCount: number; total: number; pageSize: number; onPageChange: (page: number) => void }) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return <div className="flex flex-col items-center justify-between gap-3 border-t border-[var(--admin-border)] px-4 py-3 text-xs text-[var(--admin-muted)] sm:flex-row"><p>Showing {from}–{to} of {total}</p><div className="flex items-center gap-2"><Button isIconOnly size="sm" variant="outline" aria-label="Previous page" isDisabled={page <= 1} onPress={() => onPageChange(page - 1)}><CaretLeftIcon size={15} /></Button><span className="min-w-20 text-center font-semibold text-[var(--admin-text)]">Page {page} of {Math.max(1, pageCount)}</span><Button isIconOnly size="sm" variant="outline" aria-label="Next page" isDisabled={page >= pageCount} onPress={() => onPageChange(page + 1)}><CaretRightIcon size={15} /></Button></div></div>;
}

export function formatCambodiaDate(value: string | Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Phnom_Penh", day: "2-digit", month: "short", year: "numeric", ...options }).format(new Date(value));
}
