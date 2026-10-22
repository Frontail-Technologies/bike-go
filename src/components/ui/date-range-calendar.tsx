"use client";

import { RangeCalendar, type RangeCalendarProps } from "@heroui/react";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import type { DateValue } from "@internationalized/date";
import { cn } from "@/lib/cn";

export type DateRange = NonNullable<RangeCalendarProps<DateValue>["value"]>;

type DateRangeCalendarProps = Omit<RangeCalendarProps<DateValue>, "children"> & { className?: string };

/** Responsive range calendar: fills its container, 44px+ day cells. */
export function DateRangeCalendar({ className, ...props }: DateRangeCalendarProps) {
  return (
    <RangeCalendar firstDayOfWeek="mon" className={cn("w-full max-w-none", className)} {...props}>
      <RangeCalendar.Header>
        <RangeCalendar.Heading className="font-bold" />
        <RangeCalendar.NavButton slot="previous" aria-label="Previous month">
          <CaretLeftIcon size={20} />
        </RangeCalendar.NavButton>
        <RangeCalendar.NavButton slot="next" aria-label="Next month">
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
