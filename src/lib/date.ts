import { CalendarDate, type DateValue, parseDate } from "@internationalized/date";
import type { DateRange } from "@/components/ui/date-range-calendar";
import { intlLocale } from "@/i18n/hooks";

export const CAMBODIA_TIME_ZONE = "Asia/Phnom_Penh";
const ICT_OFFSET = "+07:00";

function validDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function displayDate(value: string) {
  const direct = validDate(value);
  if (direct) return direct;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? validDate(`${value}T12:00:00${ICT_OFFSET}`) : null;
}

export function formatDate(value: Date | string, options: Intl.DateTimeFormatOptions = {}) {
  const date = validDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat(intlLocale(), {
    timeZone: CAMBODIA_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(date);
}

export function formatDateTime(value: Date | string) {
  return formatDate(value, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
}

export function formatShort(value: Date | string) {
  return formatDate(value, { year: undefined, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
}

export function formatTime(value: Date | string) {
  const date = validDate(value);
  return date
    ? new Intl.DateTimeFormat(intlLocale(), { timeZone: CAMBODIA_TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date)
    : "";
}

export function formatRange(start: string, end: string) {
  const from = displayDate(start);
  const to = displayDate(end);
  if (!from || !to) return "";
  const formatter = new Intl.DateTimeFormat(intlLocale(), { timeZone: CAMBODIA_TIME_ZONE, day: "numeric", month: "short" });
  return `${formatter.format(from)} – ${formatter.format(to)}`;
}

export function formatDay(value: string, withYear = true) {
  const date = displayDate(value);
  return date ? formatDate(date, { year: withYear ? "numeric" : undefined }) : "";
}

export function toISO(date: DateValue) {
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

export function rentalDays(start: string, end: string) {
  return Math.max(1, parseDate(end).compare(parseDate(start)));
}

export const rentalDaysBetween = rentalDays;

export function ictLocalToIso(date: string, time = "00:00:00") {
  const local = time === "00:00:00" && date.includes("T") ? date : `${date}T${time}`;
  const normalized = local.length === 16 ? `${local}:00` : local;
  return new Date(`${normalized}${ICT_OFFSET}`).toISOString();
}

export function isoToIctLocal(value: string) {
  const date = validDate(value);
  if (!date) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CAMBODIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export function cambodiaRentalRange(start: string, end: string) {
  return { pickupAt: ictLocalToIso(start, "10:00:00"), returnAt: ictLocalToIso(end, "10:00:00") };
}

export function cambodiaRentalDateTime(date: string, displayTime: string) {
  const match = displayTime.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return ictLocalToIso(date, "10:00:00");
  let hour = Number(match[1]);
  if (match[3].toUpperCase() === "AM" && hour === 12) hour = 0;
  if (match[3].toUpperCase() === "PM" && hour !== 12) hour += 12;
  return ictLocalToIso(date, `${String(hour).padStart(2, "0")}:${match[2]}:00`);
}
