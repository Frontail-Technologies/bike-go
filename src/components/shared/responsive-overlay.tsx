"use client";

import { Popover, useOverlayState } from "@heroui/react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useIsDesktop } from "@/hooks/use-media-query";
import { cn } from "@/lib/cn";

type ResponsiveOverlayProps = {
  triggerLabel: React.ReactNode;
  triggerProps?: Omit<ButtonProps, "children" | "onPress">;
  title: string;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  footer?: React.ReactNode;
  popoverClassName?: string;
  onOpen?: () => void;
};

export function ResponsiveOverlay({
  triggerLabel,
  triggerProps,
  title,
  children,
  footer,
  popoverClassName,
  onOpen,
}: ResponsiveOverlayProps) {
  const isDesktop = useIsDesktop();
  const state = useOverlayState();
  const content = typeof children === "function" ? children(state.close) : children;

  if (isDesktop) {
    return (
      <Popover
        isOpen={state.isOpen}
        onOpenChange={(open) => {
          if (open) onOpen?.();
          state.setOpen(open);
        }}
      >
        <Button {...triggerProps}>{triggerLabel}</Button>
        <Popover.Content placement="bottom start" className={cn("w-[360px]", popoverClassName)}>
          <Popover.Dialog className="flex flex-col gap-4 p-5">
            <Popover.Heading className="text-base font-bold">{title}</Popover.Heading>
            {content}
            {footer ? <div className="flex gap-3">{footer}</div> : null}
          </Popover.Dialog>
        </Popover.Content>
      </Popover>
    );
  }

  return (
    <>
      <Button
        {...triggerProps}
        onPress={() => {
          onOpen?.();
          state.open();
        }}
      >
        {triggerLabel}
      </Button>
      <BottomSheet isOpen={state.isOpen} onOpenChange={state.setOpen} title={title} footer={footer}>
        {content}
      </BottomSheet>
    </>
  );
}
