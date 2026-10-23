"use client";

import { CheckIcon, XIcon } from "@phosphor-icons/react/ssr";
import { useTranslations } from "@/i18n/hooks";
import { cn } from "@/lib/cn";
import type { CustomerBooking } from "./types";
import { formatDay } from "./dates";

type StepState = "done" | "current" | "todo" | "cancelled";
type Step = { title: string; detail: string; state: StepState };

type T = ReturnType<typeof useTranslations<"booking">>;

export function timelineFor(b: CustomerBooking, t: T): Step[] {
  const booked: Step = { title: t("tlConfirmed"), detail: formatDay(b.createdAt.slice(0, 10)), state: "done" };

  if (b.status === "cancelled") {
    return [booked, { title: t("tlCancelled"), detail: b.cancelledAt ? formatDay(b.cancelledAt.slice(0, 10)) : t("tlCancelledDetail"), state: "cancelled" }];
  }

  const rank = { upcoming: 1, ongoing: 2, completed: 4 }[b.status];
  const state = (index: number): StepState => (index < rank ? "done" : index === rank ? "current" : "todo");

  return [
    booked,
    { title: t("tlReady"), detail: `${formatDay(b.startDate)} · ${b.pickupTime}`, state: state(1) },
    { title: t("tlOnRent"), detail: t("tlRange", { from: formatDay(b.startDate, false), to: formatDay(b.endDate, false) }), state: state(2) },
    { title: t("tlReturn"), detail: `${formatDay(b.endDate)} · ${b.dropTime}`, state: state(3) },
  ];
}

const dot: Record<StepState, string> = {
  done: "bg-brand text-ink",
  current: "border-2 border-brand bg-surface text-ink",
  todo: "border-2 border-line bg-surface text-transparent",
  cancelled: "bg-danger text-ink",
};

export function BookingTimeline({ booking }: { booking: CustomerBooking }) {
  const t = useTranslations("booking");
  const steps = timelineFor(booking, t);

  return (
    <ol aria-label={t("progressAria")} className="flex flex-col">
      {steps.map((step, i) => (
        <li key={step.title} aria-current={step.state === "current" ? "step" : undefined} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full", dot[step.state])}>
              {step.state === "done" ? <CheckIcon size={14} weight="bold" /> : null}
              {step.state === "cancelled" ? <XIcon size={14} weight="bold" /> : null}
              {step.state === "current" ? <span className="size-2 rounded-full bg-brand" /> : null}
            </span>
            {i < steps.length - 1 ? <span className={cn("my-1 w-0.5 flex-1", step.state === "done" ? "bg-brand" : "bg-line")} /> : null}
          </div>
          <div className="pb-5">
            <p className={cn("text-sm", step.state === "todo" ? "font-medium text-subtle" : "font-bold")}>{step.title}</p>
            <p className="tabular text-xs text-subtle">{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
