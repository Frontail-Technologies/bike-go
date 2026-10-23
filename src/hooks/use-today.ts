"use client";

import { type CalendarDate, getLocalTimeZone, parseDate, today } from "@internationalized/date";
import { useMemo, useSyncExternalStore } from "react";

const subscribe = () => () => {};

export function useToday(): CalendarDate | undefined {
  const iso = useSyncExternalStore(
    subscribe,
    () => today(getLocalTimeZone()).toString(),
    () => undefined,
  );
  return useMemo(() => (iso ? parseDate(iso) : undefined), [iso]);
}
