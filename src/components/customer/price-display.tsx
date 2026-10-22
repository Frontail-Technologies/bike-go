import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";

type PriceDisplayProps = {
  amount: number;
  unit?: "day" | "hour" | "week" | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = { sm: "text-sm", md: "text-base", lg: "text-2xl" } as const;

export function PriceDisplay({ amount, unit = "day", size = "md", className }: PriceDisplayProps) {
  return (
    <span className={cn("tabular inline-flex items-baseline gap-1", className)}>
      <span className={cn("font-extrabold tracking-tight", sizes[size])}>{formatPrice(amount)}</span>
      {unit ? <span className="text-xs font-medium text-subtle">/ {unit}</span> : null}
    </span>
  );
}
