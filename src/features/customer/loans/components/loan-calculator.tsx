"use client";

import { InfoIcon } from "@phosphor-icons/react";
import { Label, Slider } from "@heroui/react";
import { useState } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { ChipGroup } from "@/components/ui/chip-group";
import { formatMoney, formatPrice } from "@/lib/format";
import { useTranslations } from "@/i18n/hooks";
import { getLoanType, tenuresFor } from "../lib/data";
import { useLoanQuote } from "../hooks/use-loan-quote";

const type = getLoanType("personal")!;
const tenures = tenuresFor(type);

function SingleSlider({
  label,
  value,
  min,
  max,
  step,
  display,
  minLabel,
  maxLabel,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  minLabel: string;
  maxLabel: string;
  onChange: (value: number) => void;
}) {
  return (
    <Slider className="w-full" minValue={min} maxValue={max} step={step} value={value} onChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}>
      <Label className="text-sm text-subtle">{label}</Label>
      <p className="tabular text-2xl font-extrabold" aria-live="polite">
        {display}
      </p>
      <Slider.Track>
        {({ state }) => (
          <>
            <Slider.Fill />
            {state.values.map((_, i) => (
              <Slider.Thumb key={i} index={i} />
            ))}
          </>
        )}
      </Slider.Track>
      <div className="mt-1 flex justify-between text-xs text-subtle">
        <span className="tabular">{minLabel}</span>
        <span className="tabular">{maxLabel}</span>
      </div>
    </Slider>
  );
}

export function LoanCalculator() {
  const t = useTranslations("loans");
  const [amount, setAmount] = useState(5000);
  const [tenure, setTenure] = useState(24);

  const quote = useLoanQuote({ loanType: type.id, amount, tenureMonths: tenure });
  const monthly = (quote.data?.monthlyPaymentMinor ?? 0) / 100;
  const total = (quote.data?.totalPaymentMinor ?? 0) / 100;
  const interest = (quote.data?.totalInterestMinor ?? 0) / 100;
  const effectiveRate = (quote.data?.interestRateBps ?? Math.round(type.apr * 100)) / 100;

  return (
    <div className="grid gap-5 md:grid-cols-2 md:gap-8">
      <div className="flex flex-col gap-6 rounded-card border border-line bg-surface p-4 shadow-card md:p-6">
        <SingleSlider
          label={t("calcLoanAmount")}
          value={amount}
          min={type.minAmount}
          max={type.maxAmount}
          step={500}
          display={formatPrice(amount)}
          minLabel={formatPrice(type.minAmount)}
          maxLabel={formatPrice(type.maxAmount)}
          onChange={setAmount}
        />

        <div className="flex flex-col gap-2">
          <p className="text-sm text-subtle">{t("calcTenure")}</p>
          <p className="tabular text-2xl font-extrabold">{t("calcMonths", { count: tenure })}</p>
          <ChipGroup
            label={t("calcTenureAria")}
            options={tenures.map((t) => ({ id: String(t), label: String(t) }))}
            value={[String(tenure)]}
            onChange={(ids) => ids[0] && setTenure(Number(ids[0]))}
          />
        </div>

        <div className="rounded-control bg-surface-secondary p-4"><p className="text-sm text-subtle">{t("calcRate")}</p><p className="tabular text-2xl font-extrabold">{effectiveRate}%</p></div>
      </div>

      <div className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4 shadow-card md:p-6">
        <div>
          <p className="text-sm text-subtle">{t("calcEmi")}</p>
          <p data-testid="emi" className="tabular text-4xl font-extrabold">
            {formatMoney(monthly)}
          </p>
        </div>
        <dl className="flex flex-col gap-3 border-t border-line pt-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-subtle">{t("calcPrincipal")}</dt>
            <dd className="tabular font-semibold">{formatMoney(amount)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-subtle">{t("calcInterest")}</dt>
            <dd className="tabular font-semibold">{formatMoney(interest)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-line pt-3">
            <dt className="font-bold">{t("calcTotal")}</dt>
            <dd className="tabular font-bold">{formatMoney(total)}</dd>
          </div>
        </dl>
        <p className="flex items-start gap-2 text-xs leading-5 text-subtle">
          <InfoIcon size={16} className="mt-0.5 shrink-0" />
          {t("calcNote")}
        </p>
        <ButtonLink href={`/loans/apply?type=personal&amount=${amount}&tenure=${tenure}`} size="lg" fullWidth className="mt-auto">
          {t("calcApply")}
        </ButtonLink>
      </div>
    </div>
  );
}
