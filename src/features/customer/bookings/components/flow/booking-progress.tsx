import { useTranslations } from "@/i18n/hooks";
import { cn } from "@/lib/cn";

export const flowSteps = ["stepDates", "stepRider", "stepLicence", "stepReview", "stepPayment"] as const;

export function BookingProgress({ step }: { step: number }) {
  const t = useTranslations("booking");

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-subtle" aria-live="polite">
        {t.rich("stepOf", { step: step + 1, total: flowSteps.length, name: t(flowSteps[step]!), b: (chunks) => <span className="font-bold text-ink">{chunks}</span> })}
      </p>
      <ol className="flex gap-1.5" aria-label={t("progressAria")}>
        {flowSteps.map((label, i) => (
          <li
            key={label}
            aria-current={i === step ? "step" : undefined}
            aria-label={i < step ? t("stepDone", { label: t(label) }) : i === step ? t("stepCurrent", { label: t(label) }) : t(label)}
            className={cn("h-1.5 flex-1 rounded-full transition-colors duration-200 motion-reduce:transition-none", i <= step ? "bg-brand" : "bg-line")}
          />
        ))}
      </ol>
    </div>
  );
}
