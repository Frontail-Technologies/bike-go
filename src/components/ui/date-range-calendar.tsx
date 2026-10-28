"use client";

import { RangeCalendar, type RangeCalendarProps } from "@heroui/react";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import type { DateValue } from "@internationalized/date";
import { useTranslations } from "@/i18n/hooks";
import { cn } from "@/lib/cn";

export type DateRange = NonNullable<RangeCalendarProps<DateValue>["value"]>;

type DateRangeCalendarProps = Omit<RangeCalendarProps<DateValue>, "children"> & { className?: string };

export function DateRangeCalendar({ className, ...props }: DateRangeCalendarProps) {
  const t = useTranslations("common");

  return (
    <RangeCalendar firstDayOfWeek="mon" className={cn("mx-auto", className)} {...props}>
      <RangeCalendar.Header>
        <RangeCalendar.Heading className="font-bold" />
        <RangeCalendar.NavButton slot="previous" aria-label={t("previousMonth")}>
          <CaretLeftIcon size={20} />
        </RangeCalendar.NavButton>
        <RangeCalendar.NavButton slot="next" aria-label={t("nextMonth")}>
          <CaretRightIcon size={20} />
        </RangeCalendar.NavButton>
      </RangeCalendar.Header>
      <RangeCalendar.Grid>
        <RangeCalendar.GridHeader>
          {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
        </RangeCalendar.GridHeader>
        <RangeCalendar.GridBody>{(date) => <RangeCalendar.Cell date={date} />}</RangeCalendar.GridBody>
      </RangeCalendar.Grid>
    </RangeCalendar>
  );
}
