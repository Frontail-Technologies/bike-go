"use client";

import { CheckIcon, WarningIcon, XIcon } from "@phosphor-icons/react/ssr";
import { formatDay } from "@/features/bookings/dates";
import { cn } from "@/lib/cn";
import { useLoanText } from "./use-loan-text";
import type { LoanApplication, LoanStatus } from "./data";

type StepState = "done" | "current" | "todo" | "rejected" | "attention";
type Step = { title: string; detail: string; notes: string[]; state: StepState };

const formatWhen = (iso: string) => formatDay(iso.slice(0, 10));

/** Which stage a status event belongs to: 0 submitted, 1 documents, 2 eligibility, 3 decision. */
const stageOf: Record<LoanStatus, number> = { submitted: 0, "documents-required": 1, "in-review": 1, approved: 3, rejected: 3 };

/** Stage the application is at now, and how that stage looks. */
const position: Record<LoanStatus, { stage: number; state: StepState }> = {
  submitted: { stage: 1, state: "current" },
  "in-review": { stage: 2, state: "current" },
  "documents-required": { stage: 1, state: "attention" },
  approved: { stage: 3, state: "done" },
  rejected: { stage: 3, state: "rejected" },
};

type Text = ReturnType<typeof useLoanText>;

export function timelineFor(a: LoanApplication, { t, note }: Pick<Text, "t" | "note">): Step[] {
  const titles = [t("tlSubmitted"), t("tlDocsReview"), t("tlEligibility"), a.status === "approved" ? t("tlApproved") : a.status === "rejected" ? t("tlNotApproved") : t("tlFinal")];
  const { stage: current, state } = position[a.status];

  const notes: string[][] = [[], [], [], []];
  for (const event of a.history) if (event.note) notes[stageOf[event.status]].push(note(event.note));

  return titles.map((title, i) => {
    const stepState: StepState = i < current ? "done" : i === current ? state : "todo";
    let detail = t("tlPending");
    if (i === 0) detail = formatWhen(a.createdAt);
    else if (stepState === "current") detail = t("tlProgress");
    else if (stepState === "attention") detail = t("tlAction");
    else if (stepState === "done" || stepState === "rejected") {
      const event = a.history.filter((h) => stageOf[h.status] >= i).at(0);
      detail = event ? formatWhen(event.at) : t("tlDone");
    }
    return { title, detail, notes: notes[i], state: stepState };
  });
}

const dot: Record<StepState, string> = {
  done: "bg-brand text-ink",
  current: "border-2 border-brand bg-surface text-ink",
  todo: "border-2 border-line bg-surface text-transparent",
  rejected: "bg-danger text-white",
  attention: "bg-brand text-ink",
};

export function LoanTimeline({ application }: { application: LoanApplication }) {
  const text = useLoanText();
  const steps = timelineFor(application, text);

  return (
    <ol aria-label={text.t("tlAria")} className="flex flex-col">
      {steps.map((step, i) => (
        <li key={step.title} aria-current={step.state === "current" || step.state === "attention" ? "step" : undefined} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full", dot[step.state])}>
              {step.state === "done" ? <CheckIcon size={14} weight="bold" /> : null}
              {step.state === "rejected" ? <XIcon size={14} weight="bold" /> : null}
              {step.state === "attention" ? <WarningIcon size={14} weight="bold" /> : null}
              {step.state === "current" ? <span className="size-2 rounded-full bg-brand" /> : null}
            </span>
            {i < steps.length - 1 ? <span className={cn("my-1 w-0.5 flex-1", step.state === "done" ? "bg-brand" : "bg-line")} /> : null}
          </div>
          <div className="pb-5">
            <p className={cn("text-sm", step.state === "todo" ? "font-medium text-subtle" : "font-bold")}>{step.title}</p>
            <p
              className={cn(
                "tabular text-xs",
                step.state === "current" || step.state === "attention" ? "font-semibold text-[#b45309]" : "text-subtle",
              )}
            >
              {step.detail}
            </p>
            {step.notes.map((note) => (
              <p key={note} className="mt-1 text-xs leading-5 text-ink/75">
                {note}
              </p>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}
