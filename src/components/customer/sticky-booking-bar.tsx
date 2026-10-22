import { PriceDisplay } from "@/components/customer/price-display";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type StickyBookingBarProps = {
  amount: number;
  unit?: "day" | "week";
  label?: string;
  onPress?: () => void;
  isDisabled?: boolean;
  /** Sticks within its scroll parent (showcase). Default pins to the viewport. */
  inline?: boolean;
  className?: string;
};

/**
 * Primary booking action pinned to the bottom edge.
 * Below 768px it sits directly above the fixed bottom nav; from 768px there is
 * no bottom nav, so it sits on the safe-area edge instead.
 */
export function StickyBookingBar({
  amount,
  unit = "day",
  label = "Book this bike",
  onPress,
  isDisabled,
  inline = false,
  className,
}: StickyBookingBarProps) {
  return (
    <div
      data-testid="sticky-cta"
      className={cn(
        "z-30 border-t border-line bg-surface/95 px-page py-3 shadow-nav backdrop-blur-md",
        inline
          ? "sticky bottom-0"
          : "fixed inset-x-0 bottom-[calc(var(--bottom-nav-height)+var(--safe-bottom))] md:bottom-0 md:pb-[calc(0.75rem+var(--safe-bottom))]",
        className,
      )}
    >
      <div className="mx-auto flex max-w-md items-center justify-between gap-4 md:max-w-3xl">
        <PriceDisplay amount={amount} unit={unit} size="lg" />
        <Button onPress={onPress} isDisabled={isDisabled} className="min-w-40 flex-1 sm:flex-none">
          {label}
        </Button>
      </div>
    </div>
  );
}
