"use client";

import { Modal } from "@heroui/react";
import { useBackToClose } from "@/hooks/use-back-to-close";
import { cn } from "@/lib/cn";

type ModalDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "xs" | "sm" | "md" | "lg";
  placement?: "auto" | "top" | "center" | "bottom";
  className?: string;
};

export function ModalDialog({ isOpen, onOpenChange, title, children, footer, size = "sm", placement, className }: ModalDialogProps) {
  useBackToClose(isOpen, () => onOpenChange(false));

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container size={size} placement={placement}>
        <Modal.Dialog className={cn("gap-4", className)}>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading className="text-lg font-bold">{title}</Modal.Heading>
          </Modal.Header>
          <Modal.Body>{children}</Modal.Body>
          {footer ? <Modal.Footer>{footer}</Modal.Footer> : null}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
