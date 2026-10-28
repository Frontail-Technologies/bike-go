"use client";

import { Button as HeroButton, Spinner, type ButtonProps } from "@heroui/react";
import { cn } from "@/lib/cn";

export type { ButtonProps };

/**
 * HeroUI exposes pending state for behavior and styling, but intentionally does
 * not inject a visual indicator. This wrapper gives static-label buttons a
 * consistent spinner while retaining HeroUI's render-prop API for callers that
 * need custom pending content.
 */
export function Button({ children, isPending, ...props }: ButtonProps) {
  return (
    <HeroButton {...props} isPending={isPending}>
      {typeof children === "function" ? children : (
        <>
          {isPending ? <Spinner aria-hidden="true" color="current" size="sm" /> : null}
          {children}
        </>
      )}
    </HeroButton>
  );
}

type IconButtonProps = Omit<ButtonProps, "isIconOnly" | "children" | "aria-label"> & {
  label: string;
  icon: React.ReactNode;
};

export function IconButton({ label, icon, variant = "ghost", className, ...props }: IconButtonProps) {
  return (
    <Button
      isIconOnly
      aria-label={label}
      variant={variant}
      className={cn("shrink-0", className)}
      {...props}
    >
      {icon}
    </Button>
  );
}
