"use client";

import { CalendarBlankIcon, ClockIcon } from "@phosphor-icons/react";
import type { DateValue } from "@internationalized/date";
import { DateRangeCalendar, type DateRange } from "@/components/ui/date-range-calendar";
import { AppSelect } from "@/components/ui/select";
import { timeSlots } from "@/features/mock/data";
import { useToday } from "@/hooks/use-today";
import { useTranslations } from "@/i18n/hooks";
import { cn } from "@/lib/cn";

export type RentalSelection = {
  range: DateRange | null;
  pickupTime: string;
  dropTime: string;
};

type RentalDateSelectorProps = {
  value: RentalSelection;
  onChange: (value: RentalSelection) => void;
  /** Dates that cannot be booked (already rented). */
  isDateUnavailable?: (date: DateValue) => boolean;
  className?: string;
};

export function rentalDays(range: RentalSelection["range"]) {
  if (!range) return 0;
  const diff = range.end.compare(range.start);
  return Math.max(1, diff);
}

export function RentalDateSelector({ value, onChange, isDateUnavailable, className }: RentalDateSelectorProps) {
  const days = rentalDays(value.range);
  const minDate = useToday();
  const t = useTranslations("booking");
  const common = useTranslations("common");

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="rounded-card border border-line bg-surface p-1 sm:p-4">
        <DateRangeCalendar
          aria-label={t("rentalDates")}
          value={value.range}
          onChange={(range) => onChange({ ...value, range })}
          minValue={minDate}
          isDateUnavailable={isDateUnavailable}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <AppSelect
          label={t("pickupTime")}
          options={timeSlots}
          value={value.pickupTime}
          onChange={(key) => key && onChange({ ...value, pickupTime: String(key) })}
        />
        <AppSelect
          label={t("dropTime")}
          options={timeSlots}
          value={value.dropTime}
          onChange={(key) => key && onChange({ ...value, dropTime: String(key) })}
        />
      </div>

      <div className="flex items-center justify-between rounded-control bg-brand-soft px-4 py-3 text-sm" aria-live="polite">
        <span className="flex items-center gap-2 font-medium">
          {value.range ? <ClockIcon size={20} /> : <CalendarBlankIcon size={20} />}
          {value.range ? t("totalDuration") : t("selectDatesPrompt")}
        </span>
        {value.range ? <span className="tabular font-bold">{common("days", { count: days })}</span> : null}
      </div>
    </div>
  );
}
