"use client";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { useIsDesktop } from "@/hooks/use-media-query";

type ResponsiveDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function ResponsiveDialog(props: ResponsiveDialogProps) {
  const isDesktop = useIsDesktop();
  return isDesktop ? <ModalDialog {...props} /> : <BottomSheet {...props} />;
}
