"use client";

import { Drawer } from "@heroui/react";
import { useBackToClose } from "@/hooks/use-back-to-close";
import { cn } from "@/lib/cn";

type BottomSheetProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export function BottomSheet({ isOpen, onOpenChange, title, children, footer, className }: BottomSheetProps) {
  useBackToClose(isOpen, () => onOpenChange(false));

  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Content placement="bottom">
        <Drawer.Dialog className={cn("rgo-sheet", className)}>
          <Drawer.Handle />
          <Drawer.Header>
            <Drawer.Heading className="text-lg font-bold">{title}</Drawer.Heading>
          </Drawer.Header>
          <Drawer.Body>{children}</Drawer.Body>
          {footer ? <Drawer.Footer className="rgo-sheet-footer">{footer}</Drawer.Footer> : null}
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
