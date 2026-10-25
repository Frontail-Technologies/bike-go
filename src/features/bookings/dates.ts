import { CalendarDate, type DateValue, parseDate } from "@internationalized/date";
import type { DateRange } from "@/components/ui/date-range-calendar";
import type { Motorcycle } from "@/features/vehicles/view-model";
import { intlLocale } from "@/i18n/hooks";

export function toISO(date: DateValue): string {
  return new CalendarDate(date.year, date.month, date.day).toString();
}

export function toRange(start?: string, end?: string): DateRange | null {
  if (!start || !end) return null;
  try {
    return { start: parseDate(start), end: parseDate(end) };
  } catch {
    return null;
  }
}

export function rentalDaysBetween(start: string, end: string): number {
  const diff = parseDate(end).compare(parseDate(start));
  return Math.max(1, diff);
}

export function isBooked(bike: Motorcycle, date: DateValue): boolean {
  const iso = toISO(date);
  if (!bike.available && bike.availableFrom && iso < bike.availableFrom) return true;
  return bike.bookedRanges.some(([from, to]) => iso >= from && iso <= to);
}

export function rangeOverlapsBooking(bike: Motorcycle, start: string, end: string): boolean {
  return bike.bookedRanges.some(([from, to]) => start <= to && end >= from);
}

export function formatRange(start: string, end: string): string {
  const fmt = new Intl.DateTimeFormat(intlLocale(), { day: "numeric", month: "short" });
  const s = new Date(`${start}T12:00:00`);
  const e = new Date(`${end}T12:00:00`);
  return `${fmt.format(s)} – ${fmt.format(e)}`;
}

export function formatDay(iso: string, withYear = true): string {
  return new Intl.DateTimeFormat(intlLocale(), { day: "numeric", month: "short", year: withYear ? "numeric" : undefined }).format(
    new Date(`${iso}T12:00:00`),
  );
}
