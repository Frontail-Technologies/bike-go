import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";

type PriceDisplayProps = {
  amount: number;
  unit?: "day" | "hour" | "week" | null;
  size?: "sm" | "md" | "lg";
  /** Amber price, as in the reference cards (#A16207 keeps 4.5:1 on white). */
  accent?: boolean;
  className?: string;
};

const sizes = { sm: "text-sm", md: "text-base", lg: "text-2xl" } as const;

export function PriceDisplay({ amount, unit = "day", size = "md", accent = false, className }: PriceDisplayProps) {
  return (
    <span className={cn("tabular inline-flex items-baseline gap-1", className)}>
      <span className={cn("font-extrabold tracking-tight", sizes[size], accent && "text-[#A16207]")}>{formatPrice(amount)}</span>
      {unit ? <span className="text-xs font-medium text-subtle">/ {unit}</span> : null}
    </span>
  );
}
