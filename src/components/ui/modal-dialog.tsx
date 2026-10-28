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
  /** Keep a remote mutation dialog open until its request settles. */
  isPending?: boolean;
};

export function ModalDialog({ isOpen, onOpenChange, title, children, footer, size = "sm", placement, className, isPending = false }: ModalDialogProps) {
  useBackToClose(isOpen && !isPending, () => onOpenChange(false));

  return (
    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={!isPending}
      isKeyboardDismissDisabled={isPending}
    >
      <Modal.Container size={size} placement={placement}>
        <Modal.Dialog className={cn("gap-4", className)}>
          <Modal.CloseTrigger isDisabled={isPending} />
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
