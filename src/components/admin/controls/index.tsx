"use client";

import { DateField, DateRangePicker, Label, ListBox, Pagination, RangeCalendar, SearchField, Select } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { FunnelIcon } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export function AdminSearch({ value, onChange, placeholder = "Search…", className }: { value: string; onChange: (value: string) => void; placeholder?: string; className?: string }) {
  return <SearchField value={value} onChange={onChange} aria-label={placeholder} className={cn("w-full sm:max-w-xs", className)}><SearchField.Group><SearchField.SearchIcon /><SearchField.Input placeholder={placeholder} /><SearchField.ClearButton /></SearchField.Group></SearchField>;
}

export function FilterBar({ children, search, actions, className }: { children?: ReactNode; search?: ReactNode; actions?: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-3 bg-[var(--admin-surface)] p-4 xl:flex-row xl:items-center", className)}>{search}<div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{children}</div>{actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}</div>;
}

export function AdminSelect({ label, value, onChange, options, className, icon }: { label: string; value: string; onChange: (value: string) => void; options: ReadonlyArray<{ value: string; label: string }>; className?: string; icon?: ReactNode | null }) {
  return <Select aria-label={label} value={value} onChange={(key) => key !== null && onChange(String(key))} placeholder={label} className={cn("min-w-40", className)}>
    <Label className="sr-only">{label}</Label>
    <Select.Trigger className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--admin-border)] bg-white px-3 shadow-none transition-colors hover:border-[var(--admin-border-strong)]">
      {icon === null ? null : icon ?? <FunnelIcon size={15} className="shrink-0 text-[var(--admin-muted)]" aria-hidden />}
      <Select.Value className="text-sm font-semibold" />
      <Select.Indicator />
    </Select.Trigger>
    <Select.Popover className="adminOverlay">
      <ListBox>{options.map((option) => <ListBox.Item key={option.value} id={option.value} textValue={option.label}>{option.label}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox>
    </Select.Popover>
  </Select>;
}

export type AdminDateRange = { start: string; end: string };
export function CambodiaDateFilter({ value, onChange }: { value: AdminDateRange; onChange: (range: AdminDateRange) => void }) {
  const range = { start: parseDate(value.start), end: parseDate(value.end) };
  return <DateRangePicker value={range} onChange={(next) => next && onChange({ start: next.start.toString(), end: next.end.toString() })} startName="startDate" endName="endDate">
    <Label className="sr-only">Date range, Cambodia time</Label>
    <DateField.Group className="min-h-10 rounded-xl border border-[var(--admin-border)] bg-white px-2 shadow-none" variant="secondary">
      <DateField.Input slot="start" className="text-xs font-semibold">{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
      <DateRangePicker.RangeSeparator className="text-[var(--admin-muted)]" />
      <DateField.Input slot="end" className="text-xs font-semibold">{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
      <DateField.Suffix><span className="hidden text-[10px] text-[var(--admin-muted)] sm:inline">ICT</span><DateRangePicker.Trigger><DateRangePicker.TriggerIndicator /></DateRangePicker.Trigger></DateField.Suffix>
    </DateField.Group>
    <DateRangePicker.Popover className="adminOverlay">
      <RangeCalendar aria-label="Booking date range">
        <RangeCalendar.Header><RangeCalendar.Heading /><RangeCalendar.NavButton slot="previous" /><RangeCalendar.NavButton slot="next" /></RangeCalendar.Header>
        <RangeCalendar.Grid><RangeCalendar.GridHeader>{(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}</RangeCalendar.GridHeader><RangeCalendar.GridBody>{(date) => <RangeCalendar.Cell date={date} />}</RangeCalendar.GridBody></RangeCalendar.Grid>
      </RangeCalendar>
    </DateRangePicker.Popover>
  </DateRangePicker>;
}

export function TableActions({ children }: { children: ReactNode }) { return <div className="flex items-center justify-end gap-1">{children}</div>; }

export function AdminPagination({ page, pageCount, total, pageSize, onPageChange }: { page: number; pageCount: number; total: number; pageSize: number; onPageChange: (page: number) => void }) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const visiblePages = Array.from({ length: pageCount }, (_, index) => index + 1).filter((candidate) => pageCount <= 5 || candidate === 1 || candidate === pageCount || Math.abs(candidate - page) <= 1);
  return <Pagination size="sm" className="w-full px-4 py-3 text-xs text-[var(--admin-muted)]">
    <Pagination.Summary>Showing {from}–{to} of {total}</Pagination.Summary>
    <Pagination.Content>
      <Pagination.Item><Pagination.Previous aria-label="Previous page" isDisabled={page <= 1} onPress={() => onPageChange(page - 1)}><Pagination.PreviousIcon /></Pagination.Previous></Pagination.Item>
      {visiblePages.map((candidate, index) => <Fragment key={candidate}>{index > 0 && candidate - visiblePages[index - 1] > 1 ? <Pagination.Item><Pagination.Ellipsis /></Pagination.Item> : null}<Pagination.Item><Pagination.Link isActive={candidate === page} aria-label={`Page ${candidate}`} onPress={() => onPageChange(candidate)}>{candidate}</Pagination.Link></Pagination.Item></Fragment>)}
      <Pagination.Item><Pagination.Next aria-label="Next page" isDisabled={page >= pageCount} onPress={() => onPageChange(page + 1)}><Pagination.NextIcon /></Pagination.Next></Pagination.Item>
    </Pagination.Content>
  </Pagination>;
}

export function formatCambodiaDate(value: string | Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Phnom_Penh", day: "2-digit", month: "short", year: "numeric", ...options }).format(new Date(value));
}

export type ViewOption<T extends string> = { value: T; label: string; icon: ReactNode };
export function ViewToggle<T extends string>({ value, onChange, options, label = "View" }: { value: T; onChange: (value: T) => void; options: ReadonlyArray<ViewOption<T>>; label?: string }) {
  const reduce = useReducedMotion();
  return <div role="group" aria-label={label} className="relative flex shrink-0 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-0.5">
    {options.map((option) => {
      const active = option.value === value;
      return <button key={option.value} type="button" aria-pressed={active} onClick={() => onChange(option.value)} className={cn("relative flex min-h-10 items-center gap-1.5 rounded-[10px] px-3 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--admin-accent-strong)]", active ? "text-[#111820]" : "text-[var(--admin-muted)] hover:text-[var(--admin-text)]")}>
        {active ? <motion.span layoutId={`view-toggle-${label}`} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 38 }} className="absolute inset-0 rounded-[10px] bg-[var(--admin-accent)] shadow-sm" aria-hidden /> : null}
        <span className="relative flex items-center gap-1.5">{option.icon}<span className="max-sm:sr-only">{option.label}</span></span>
      </button>;
    })}
  </div>;
}
