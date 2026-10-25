"use client";

import { Alert, AlertDialog, Button, Spinner } from "@heroui/react";
import { FileMagnifyingGlassIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

export function AdminLoadingState({ label = "Loading records…" }: { label?: string }) {
  return <div role="status" className="flex min-h-40 flex-col items-center justify-center gap-3 p-8 text-sm text-[var(--admin-muted)]"><Spinner size="lg" aria-label={label} /><span>{label}</span></div>;
}

export function AdminEmptyState({ title = "Nothing here yet", description = "Records will appear here when they are available.", action }: { title?: string; description?: string; action?: ReactNode }) {
  return <div className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center"><span className="mb-3 flex size-11 items-center justify-center rounded-full bg-[var(--admin-surface-muted)] text-[var(--admin-muted)]"><FileMagnifyingGlassIcon size={23} /></span><h3 className="text-sm font-extrabold">{title}</h3><p className="mt-1 max-w-sm text-sm text-[var(--admin-muted)]">{description}</p>{action ? <div className="mt-4">{action}</div> : null}</div>;
}

export function AdminErrorState({ title = "We couldn’t load this section", description = "Try again or contact your administrator.", onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return <div className="flex min-h-48 items-center justify-center p-5"><Alert status="danger" className="max-w-md"><Alert.Indicator /><Alert.Content><Alert.Title>{title}</Alert.Title><Alert.Description>{description}</Alert.Description>{onRetry ? <Button className="mt-3" size="sm" variant="outline" onPress={onRetry}>Try again</Button> : null}</Alert.Content></Alert></div>;
}

export function AdminSuccessState({ title, description }: { title: string; description?: string }) {
  return <Alert status="success"><Alert.Indicator /><Alert.Content><Alert.Title>{title}</Alert.Title>{description ? <Alert.Description>{description}</Alert.Description> : null}</Alert.Content></Alert>;
}

export function ConfirmationDialog({ isOpen, onOpenChange, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false, isPending = false, onConfirm }: { isOpen: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean; isPending?: boolean; onConfirm: () => void }) {
  return <AlertDialog>
    <AlertDialog.Trigger className="hidden" aria-hidden="true">Open confirmation</AlertDialog.Trigger>
    <AlertDialog.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} isKeyboardDismissDisabled={isPending} isDismissable={!isPending} className="adminOverlay">
      <AlertDialog.Container>
        <AlertDialog.Dialog>
          <AlertDialog.Header><AlertDialog.Icon status={danger ? "danger" : "accent"} /><AlertDialog.Heading>{title}</AlertDialog.Heading></AlertDialog.Header>
          <AlertDialog.Body><p className="text-sm text-[var(--admin-muted)]">{description}</p></AlertDialog.Body>
          {/* The confirm button no longer auto-closes (no slot="close"): the caller keeps the dialog open until its mutation settles, then closes it itself. */}
          <AlertDialog.Footer><Button variant="tertiary" slot="close" isDisabled={isPending}>{cancelLabel}</Button><Button variant={danger ? "danger" : "primary"} isPending={isPending} isDisabled={isPending} onPress={onConfirm}>{confirmLabel}</Button></AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  </AlertDialog>;
}
