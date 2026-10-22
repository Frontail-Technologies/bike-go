import { Spinner } from "@heroui/react";
import { PriceDisplay } from "@/components/customer/price-display";
import { Button } from "@/components/ui/button";

type FlowFooterProps = {
  label: string;
  /** Amount shown beside the button (the total payable). */
  amount: number;
  /** Submit a form by id instead of calling `onPress`. */
  formId?: string;
  onPress?: () => void;
  isDisabled?: boolean;
  isPending?: boolean;
};

/** Primary action pinned to the safe-area edge on mobile. The bottom nav is hidden in this flow. */
export function FlowFooter({ label, amount, formId, onPress, isDisabled, isPending }: FlowFooterProps) {
  return (
    <div
      data-testid="flow-footer"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-page pt-3 pb-[calc(0.75rem+var(--safe-bottom))] shadow-nav backdrop-blur-md lg:static lg:border-0 lg:bg-transparent lg:px-0 lg:pb-0 lg:shadow-none"
    >
      <div className="mx-auto flex max-w-md items-center justify-between gap-4 lg:max-w-none">
        <div className="lg:hidden">
          <p className="text-xs text-subtle">Total payable</p>
          <PriceDisplay amount={amount} unit={null} size="md" precise />
        </div>
        {/*
          Always a plain button. Submitting via requestSubmit (not type="submit") means a press that
          moves to the next step can't be followed by a native click that submits the next step's form.
        */}
        <Button
          type="button"
          onPress={() => {
            if (formId) (document.getElementById(formId) as HTMLFormElement | null)?.requestSubmit();
            else onPress?.();
          }}
          isDisabled={isDisabled}
          isPending={isPending}
          size="lg"
          className="flex-1 lg:w-full lg:flex-none"
        >
          {({ isPending: pending }) => (
            <>
              {pending ? <Spinner color="current" size="sm" /> : null}
              {label}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
