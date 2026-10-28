import { PriceDisplay } from "@/components/customer/price-display";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/hooks";
import { cn } from "@/lib/cn";

type StickyBookingBarProps = {
  amount: number;
  unit?: "day" | "week";
  label?: string;
  onPress?: () => void;
  isDisabled?: boolean;
  inline?: boolean;
  className?: string;
};

export function StickyBookingBar({
  amount,
  unit = "day",
  label,
  onPress,
  isDisabled,
  inline = false,
  className,
}: StickyBookingBarProps) {
  const t = useTranslations("bike");

  return (
    <div
      data-testid="sticky-cta"
      className={cn(
        "z-30 border-t border-line bg-surface/95 px-page py-3 shadow-nav backdrop-blur-md",
        inline
          ? "sticky bottom-0"
          : "fixed inset-x-0 bottom-[var(--keyboard-inset,0px)] pb-[calc(0.75rem+var(--safe-bottom))]",
        className,
      )}
    >
      <div className="mx-auto flex max-w-md items-center justify-between gap-4 md:max-w-3xl">
        <PriceDisplay amount={amount} unit={unit} size="lg" />
        <Button onPress={onPress} isDisabled={isDisabled} className="min-w-40 flex-1 sm:flex-none">
          {label ?? t("bookThisBike")}
        </Button>
      </div>
    </div>
  );
}
