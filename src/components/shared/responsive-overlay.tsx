"use client";

import { Popover, useOverlayState } from "@heroui/react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useIsDesktop } from "@/hooks/use-media-query";
import { cn } from "@/lib/cn";

type ResponsiveOverlayProps = {
  /** Trigger button content. */
  triggerLabel: React.ReactNode;
  triggerProps?: Omit<ButtonProps, "children" | "onPress">;
  title: string;
  children: React.ReactNode;
  /** Sheet footer on mobile; rendered below the content in the popover. */
  footer?: React.ReactNode;
  popoverClassName?: string;
};

/** Bottom sheet below 768px, anchored popover from 768px up. */
export function ResponsiveOverlay({
  triggerLabel,
  triggerProps,
  title,
  children,
  footer,
  popoverClassName,
}: ResponsiveOverlayProps) {
  const isDesktop = useIsDesktop();
  const sheet = useOverlayState();

  if (isDesktop) {
    return (
      <Popover>
        <Button {...triggerProps}>{triggerLabel}</Button>
        <Popover.Content placement="bottom start" className={cn("w-[360px]", popoverClassName)}>
          <Popover.Dialog className="flex flex-col gap-4 p-5">
            <Popover.Heading className="text-base font-bold">{title}</Popover.Heading>
            {children}
            {footer ? <div className="flex gap-3">{footer}</div> : null}
          </Popover.Dialog>
        </Popover.Content>
      </Popover>
    );
  }

  return (
    <>
      <Button {...triggerProps} onPress={sheet.open}>
        {triggerLabel}
      </Button>
      <BottomSheet isOpen={sheet.isOpen} onOpenChange={sheet.setOpen} title={title} footer={footer}>
        {children}
      </BottomSheet>
    </>
  );
}
