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

/**
 * Forms and pickers: a bottom sheet on phones (thumb-reachable, swipe to dismiss, Back closes it) and a
 * centred dialog from 768px. Use plain ModalDialog for short confirmations (cancel, log out).
 */
export function ResponsiveDialog(props: ResponsiveDialogProps) {
  const isDesktop = useIsDesktop();
  return isDesktop ? <ModalDialog {...props} /> : <BottomSheet {...props} />;
}
