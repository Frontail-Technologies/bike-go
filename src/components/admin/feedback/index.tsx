"use client";

import { AlertDialog, Button, Spinner } from "@heroui/react";
import { CheckCircleIcon, FileMagnifyingGlassIcon, WarningCircleIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

export function AdminLoadingState({ label = "Loading records…" }: { label?: string }) { return <div role="status" className="flex min-h-40 flex-col items-center justify-center gap-3 p-8 text-sm text-[var(--admin-muted)]"><Spinner size="lg" /><span>{label}</span></div>; }
export function AdminEmptyState({ title = "Nothing here yet", description = "Records will appear here when they are available.", action }: { title?: string; description?: string; action?: ReactNode }) { return <div className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center"><span className="mb-3 flex size-11 items-center justify-center rounded-full bg-[var(--admin-surface-muted)] text-[var(--admin-muted)]"><FileMagnifyingGlassIcon size={23} /></span><h3 className="text-sm font-extrabold">{title}</h3><p className="mt-1 max-w-sm text-sm text-[var(--admin-muted)]">{description}</p>{action ? <div className="mt-4">{action}</div> : null}</div>; }
export function AdminErrorState({ title = "We couldn’t load this section", description = "Try again or contact your administrator.", onRetry }: { title?: string; description?: string; onRetry?: () => void }) { return <div role="alert" className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center"><WarningCircleIcon size={30} className="mb-3 text-[var(--admin-danger)]" /><h3 className="text-sm font-extrabold">{title}</h3><p className="mt-1 max-w-sm text-sm text-[var(--admin-muted)]">{description}</p>{onRetry ? <Button className="mt-4" variant="outline" onPress={onRetry}>Try again</Button> : null}</div>; }
export function AdminSuccessState({ title, description }: { title: string; description?: string }) { return <div role="status" className="flex items-start gap-3 rounded-xl bg-[var(--admin-success-soft)] p-4 text-[var(--admin-success)]"><CheckCircleIcon size={22} weight="fill" /><div><p className="text-sm font-bold">{title}</p>{description ? <p className="mt-0.5 text-xs">{description}</p> : null}</div></div>; }

export function ConfirmationDialog({ isOpen, onOpenChange, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false, onConfirm }: { isOpen: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean; onConfirm: () => void }) {
  return <AlertDialog isOpen={isOpen} onOpenChange={onOpenChange}>
    <AlertDialog.Trigger className="hidden" aria-hidden="true">Open confirmation</AlertDialog.Trigger>
    <AlertDialog.Backdrop className="adminOverlay">
      <AlertDialog.Container>
        <AlertDialog.Dialog>
          <AlertDialog.Header><AlertDialog.Heading>{title}</AlertDialog.Heading></AlertDialog.Header>
          <AlertDialog.Body><p className="text-sm text-[var(--admin-muted)]">{description}</p></AlertDialog.Body>
          <AlertDialog.Footer><Button variant="outline" slot="close">{cancelLabel}</Button><Button variant={danger ? "danger" : "primary"} onPress={() => { onConfirm(); onOpenChange(false); }}>{confirmLabel}</Button></AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  </AlertDialog>;
}
