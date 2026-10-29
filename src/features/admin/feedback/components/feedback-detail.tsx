"use client";

import { TextArea } from "@heroui/react";
import { CheckCircleIcon, EnvelopeSimpleIcon, UserCircleIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminButton as Button, formatCambodiaDate } from "@/components/admin/controls";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { AdminErrorState, AdminLoadingState } from "@/components/admin/feedback";
import { AdminPage, PageHeader } from "@/components/admin/layout";
import { AdminBreadcrumbs } from "@/components/admin/navigation";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/error";
import { useFeedbackMutations, useFeedbackTicketQuery } from "../hooks/use-feedback";
import { categoryLabels, ticketBadge } from "../lib/feedback-model";
import type { SupportTicket } from "../types/feedback";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";
import { adminT } from "@/features/admin/i18n/translate";

const dateTime = (value: string) => formatCambodiaDate(value, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const failure = (error: unknown) => (error instanceof ApiError ? error.message : adminT("common.genericError"));

function Workspace({ ticket }: { ticket: SupportTicket }) {
  const t = useAdminTranslations();
  const router = useRouter();
  const mutations = useFeedbackMutations();
  const [note, setNote] = useState(ticket.adminNote ?? "");
  const noteDirty = note.trim() !== (ticket.adminNote ?? "");

  function toggleStatus() {
    const status = ticket.status === "open" ? "resolved" : "open";
    mutations.update.mutate({ reference: ticket.reference, status }, {
      onSuccess: () => toast.success(status === "resolved" ? t("feedback.resolved") : t("feedback.reopened")),
      onError: (error) => toast.danger(failure(error)),
    });
  }

  function saveNote() {
    mutations.update.mutate({ reference: ticket.reference, adminNote: note.trim() || null }, {
      onSuccess: () => toast.success(t("feedback.noteSaved")),
      onError: (error) => toast.danger(failure(error)),
    });
  }

  const badge = ticketBadge(ticket.status);

  return (
    <AdminPage className="gap-4">
      <AdminBreadcrumbs items={[{ label: t("pages.feedback.title"), href: "/admin/feedback" }, { label: ticket.reference }]} />

      <header className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="truncate text-xl font-extrabold tracking-tight sm:text-2xl">{ticket.reference}</h1>
            <AdminStatusBadge status={badge.status} label={badge.label} />
          </div>
          <p className="text-sm text-(--admin-muted)">{t("feedback.submitted", { category: categoryLabels[ticket.category], date: dateTime(ticket.createdAt) })}</p>
        </div>
        <Button variant={ticket.status === "open" ? "primary" : "outline"} className="min-h-11" isPending={mutations.update.isPending} onPress={toggleStatus}>
          <CheckCircleIcon size={16} />
          {ticket.status === "open" ? t("feedback.markResolved") : t("feedback.reopen")}
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <section aria-label={t("feedback.message")} className="adminSurface space-y-3 rounded-2xl p-4 sm:p-5 lg:col-span-2">
          <h2 className="text-sm font-extrabold">{t("feedback.message")}</h2>
          <p className="whitespace-pre-wrap text-sm leading-6">{ticket.message}</p>
          {ticket.bookingReference ? (
            <p className="text-sm text-(--admin-muted)">
              {t("feedback.referencedBooking")}<button type="button" className="font-bold text-(--admin-accent-strong) underline-offset-2 hover:underline" onClick={() => router.push(`/admin/bookings/${ticket.bookingReference}`)}>{ticket.bookingReference}</button>
            </p>
          ) : null}
        </section>

        <section aria-label={t("feedback.customer")} className="adminSurface space-y-4 rounded-2xl p-4 sm:p-5">
          <h2 className="text-sm font-extrabold">{t("feedback.customer")}</h2>
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-(--admin-surface-muted) text-(--admin-muted)"><UserCircleIcon size={18} /></span>
            <div className="min-w-0 flex-1">
              <button type="button" className="truncate text-sm font-semibold text-(--admin-accent-strong) hover:underline" onClick={() => router.push(`/admin/customers/${ticket.customer.id}`)}>{ticket.customer.name}</button>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-(--admin-surface-muted) text-(--admin-muted)"><EnvelopeSimpleIcon size={18} /></span>
            <p className="min-w-0 flex-1 wrap-break-word text-sm font-semibold">{ticket.customer.email}</p>
          </div>
        </section>
      </div>

      <section aria-label={t("feedback.adminNote")} className="adminSurface space-y-3 rounded-2xl p-4 sm:p-5">
        <h2 className="text-sm font-extrabold">{t("feedback.adminNote")}</h2>
        <TextArea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder={t("feedback.notePlaceholder")} />
        <div className="flex justify-end">
          <Button variant="primary" className="min-h-11" isDisabled={!noteDirty} isPending={mutations.update.isPending} onPress={saveNote}>{t("feedback.saveNote")}</Button>
        </div>
      </section>
    </AdminPage>
  );
}

export function FeedbackDetail({ reference }: { reference: string }) {
  const t = useAdminTranslations();
  const query = useFeedbackTicketQuery(reference);
  const ticket = query.data;
  if (query.isError && !ticket) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return <AdminPage><PageHeader title={t("pages.feedback.title")} /><AdminErrorState title={notFound ? t("feedback.notFound") : t("feedback.loadTicketError")} description={query.error instanceof ApiError ? query.error.message : t("common.retryLater")} onRetry={notFound ? undefined : () => void query.refetch()} /></AdminPage>;
  }
  if (!ticket) return <AdminPage><PageHeader title={t("pages.feedback.title")} /><AdminLoadingState label={t("feedback.loadingTicket")} /></AdminPage>;
  return <Workspace key={ticket.reference} ticket={ticket} />;
}
