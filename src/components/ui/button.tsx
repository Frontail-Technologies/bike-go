"use client";

import { Button, type ButtonProps } from "@heroui/react";
import { cn } from "@/lib/cn";

export { Button };
export type { ButtonProps };

type IconButtonProps = Omit<ButtonProps, "isIconOnly" | "children" | "aria-label"> & {
  /** Required: icon-only controls need an accessible name. */
  label: string;
  icon: React.ReactNode;
};

/** 44px square icon control. Pass a 20px Phosphor icon. */
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
