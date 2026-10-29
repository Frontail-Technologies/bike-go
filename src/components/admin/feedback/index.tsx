"use client";

import { Alert, AlertDialog, Button, Spinner } from "@heroui/react";
import { FileMagnifyingGlassIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

export function AdminLoadingState({ label }: { label?: string }) {
  const t = useAdminTranslations();
  const resolvedLabel = label ?? t("common.loadingRecords");
  return <div role="status" className="flex min-h-40 flex-col items-center justify-center gap-3 p-8 text-sm text-[var(--admin-muted)]"><Spinner size="lg" aria-label={resolvedLabel} /><span>{resolvedLabel}</span></div>;
}

export function AdminEmptyState({ description, action }: { description?: string; action?: ReactNode }) {
  const t = useAdminTranslations();
  return <div className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center"><span className="mb-3 flex size-11 items-center justify-center rounded-full bg-[var(--admin-surface-muted)] text-[var(--admin-muted)]"><FileMagnifyingGlassIcon size={23} /></span><p className="max-w-sm text-sm text-[var(--admin-muted)]">{description ?? t("common.nothingHere")}</p>{action ? <div className="mt-4">{action}</div> : null}</div>;
}

export function AdminErrorState({ title, description, onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  const t = useAdminTranslations();
  return <div className="flex min-h-48 items-center justify-center p-5"><Alert status="danger" className="max-w-md"><Alert.Indicator /><Alert.Content><Alert.Title>{title ?? t("common.loadError")}</Alert.Title><Alert.Description>{description ?? t("common.contactAdmin")}</Alert.Description>{onRetry ? <Button className="mt-3" size="sm" variant="outline" onPress={onRetry}>{t("common.tryAgain")}</Button> : null}</Alert.Content></Alert></div>;
}

export function AdminSuccessState({ title, description }: { title: string; description?: string }) {
  return <Alert status="success"><Alert.Indicator /><Alert.Content><Alert.Title>{title}</Alert.Title>{description ? <Alert.Description>{description}</Alert.Description> : null}</Alert.Content></Alert>;
}

export function ConfirmationDialog({ isOpen, onOpenChange, title, description, confirmLabel, cancelLabel, danger = false, isPending = false, onConfirm }: { isOpen: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean; isPending?: boolean; onConfirm: () => void }) {
  const t = useAdminTranslations();
  return <AlertDialog>
    <AlertDialog.Trigger className="hidden" aria-hidden="true">{t("common.openConfirmation")}</AlertDialog.Trigger>
    <AlertDialog.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} isKeyboardDismissDisabled={isPending} isDismissable={!isPending} className="adminOverlay">
      <AlertDialog.Container>
        <AlertDialog.Dialog>
          <AlertDialog.Header><AlertDialog.Icon status={danger ? "danger" : "accent"} /><AlertDialog.Heading>{title}</AlertDialog.Heading></AlertDialog.Header>
          <AlertDialog.Body><p className="text-sm text-[var(--admin-muted)]">{description}</p></AlertDialog.Body>
          <AlertDialog.Footer><Button variant="tertiary" slot="close" isDisabled={isPending}>{cancelLabel ?? t("common.cancel")}</Button><Button variant={danger ? "danger" : "primary"} isPending={isPending} isDisabled={isPending} onPress={onConfirm}>{isPending ? <Spinner color="current" size="sm" /> : null}{confirmLabel ?? t("common.confirm")}</Button></AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  </AlertDialog>;
}
