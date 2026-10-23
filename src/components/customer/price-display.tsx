"use client";

import { useTranslations } from "@/i18n/hooks";
import { cn } from "@/lib/cn";
import { formatMoney, formatPrice } from "@/lib/format";

type PriceDisplayProps = {
  amount: number;
  unit?: "day" | "hour" | "week" | null;
  size?: "sm" | "md" | "lg";
  accent?: boolean;
  precise?: boolean;
  className?: string;
};

const sizes = { sm: "text-sm", md: "text-base", lg: "text-2xl" } as const;

const unitKeys = { day: "unitDay", hour: "unitHour", week: "unitWeek" } as const;

export function PriceDisplay({ amount, unit = "day", size = "md", accent = false, precise = false, className }: PriceDisplayProps) {
  const t = useTranslations("common");

  return (
    <span className={cn("tabular inline-flex items-baseline gap-1", className)}>
      <span className={cn("font-extrabold tracking-tight", sizes[size], accent && "text-[#A16207]")}>{precise ? formatMoney(amount) : formatPrice(amount)}</span>
      {unit ? <span className="text-xs font-medium text-subtle">{t(unitKeys[unit])}</span> : null}
    </span>
  );
}
