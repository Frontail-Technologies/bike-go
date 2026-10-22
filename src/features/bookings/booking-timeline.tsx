import { CheckIcon, XIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import type { CustomerBooking } from "./types";
import { formatDay } from "./dates";

type StepState = "done" | "current" | "todo" | "cancelled";
type Step = { title: string; detail: string; state: StepState };

export function timelineFor(b: CustomerBooking): Step[] {
  const booked: Step = { title: "Booking confirmed", detail: formatDay(b.createdAt.slice(0, 10)), state: "done" };

  if (b.status === "cancelled") {
    return [booked, { title: "Booking cancelled", detail: b.cancelledAt ? formatDay(b.cancelledAt.slice(0, 10)) : "Cancelled", state: "cancelled" }];
  }

  const rank = { upcoming: 1, ongoing: 2, completed: 4 }[b.status];
  const state = (index: number): StepState => (index < rank ? "done" : index === rank ? "current" : "todo");

  return [
    booked,
    { title: "Ready for pickup", detail: `${formatDay(b.startDate)} · ${b.pickupTime}`, state: state(1) },
    { title: "On rent", detail: `${formatDay(b.startDate, false)} to ${formatDay(b.endDate, false)}`, state: state(2) },
    { title: "Return bike", detail: `${formatDay(b.endDate)} · ${b.dropTime}`, state: state(3) },
  ];
}

const dot: Record<StepState, string> = {
  done: "bg-brand text-ink",
  current: "border-2 border-brand bg-surface text-ink",
  todo: "border-2 border-line bg-surface text-transparent",
  cancelled: "bg-danger text-ink",
};

export function BookingTimeline({ booking }: { booking: CustomerBooking }) {
  const steps = timelineFor(booking);

  return (
    <ol aria-label="Booking progress" className="flex flex-col">
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
