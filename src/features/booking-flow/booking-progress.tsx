import { cn } from "@/lib/cn";

export const flowSteps = ["Dates", "Rider", "Licence", "Review", "Payment"] as const;

/** Thin segmented progress: a label plus one bar per step. Not a wizard chrome. */
export function BookingProgress({ step }: { step: number }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-subtle" aria-live="polite">
        Step {step + 1} of {flowSteps.length} · <span className="font-bold text-ink">{flowSteps[step]}</span>
      </p>
      <ol className="flex gap-1.5" aria-label="Booking progress">
        {flowSteps.map((label, i) => (
          <li
            key={label}
            aria-current={i === step ? "step" : undefined}
            aria-label={`${label}${i < step ? ", done" : i === step ? ", current" : ""}`}
            className={cn("h-1.5 flex-1 rounded-full transition-colors duration-200 motion-reduce:transition-none", i <= step ? "bg-brand" : "bg-line")}
          />
        ))}
      </ol>
    </div>
  );
}
