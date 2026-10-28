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

const dateTime = (value: string) => formatCambodiaDate(value, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const failure = (error: unknown) => (error instanceof ApiError ? error.message : "Something went wrong. Try again.");

function Workspace({ ticket }: { ticket: SupportTicket }) {
  const router = useRouter();
  const mutations = useFeedbackMutations();
  const [note, setNote] = useState(ticket.adminNote ?? "");
  const noteDirty = note.trim() !== (ticket.adminNote ?? "");

  function toggleStatus() {
    const status = ticket.status === "open" ? "resolved" : "open";
    mutations.update.mutate({ reference: ticket.reference, status }, {
      onSuccess: () => toast.success(status === "resolved" ? "Marked resolved" : "Reopened"),
      onError: (error) => toast.danger(failure(error)),
    });
  }

  function saveNote() {
    mutations.update.mutate({ reference: ticket.reference, adminNote: note.trim() || null }, {
      onSuccess: () => toast.success("Note saved"),
      onError: (error) => toast.danger(failure(error)),
    });
  }

  const badge = ticketBadge(ticket.status);

  return (
    <AdminPage className="gap-4">
      <AdminBreadcrumbs items={[{ label: "Feedback", href: "/admin/feedback" }, { label: ticket.reference }]} />

      <header className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="truncate text-xl font-extrabold tracking-tight sm:text-2xl">{ticket.reference}</h1>
            <AdminStatusBadge status={badge.status} label={badge.label} />
          </div>
          <p className="text-sm text-(--admin-muted)">{categoryLabels[ticket.category]} · Submitted {dateTime(ticket.createdAt)}</p>
        </div>
        <Button variant={ticket.status === "open" ? "primary" : "outline"} className="min-h-11" isPending={mutations.update.isPending} onPress={toggleStatus}>
          <CheckCircleIcon size={16} />
          {ticket.status === "open" ? "Mark resolved" : "Reopen"}
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <section aria-label="Message" className="adminSurface space-y-3 rounded-2xl p-4 sm:p-5 lg:col-span-2">
          <h2 className="text-sm font-extrabold">Message</h2>
          <p className="whitespace-pre-wrap text-sm leading-6">{ticket.message}</p>
          {ticket.bookingReference ? (
            <p className="text-sm text-(--admin-muted)">
              Referenced booking: <button type="button" className="font-bold text-(--admin-accent-strong) underline-offset-2 hover:underline" onClick={() => router.push(`/admin/bookings/${ticket.bookingReference}`)}>{ticket.bookingReference}</button>
            </p>
          ) : null}
        </section>

        <section aria-label="Customer" className="adminSurface space-y-4 rounded-2xl p-4 sm:p-5">
          <h2 className="text-sm font-extrabold">Customer</h2>
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

      <section aria-label="Admin note" className="adminSurface space-y-3 rounded-2xl p-4 sm:p-5">
        <h2 className="text-sm font-extrabold">Admin note</h2>
        <TextArea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Internal note, not visible to the customer" />
        <div className="flex justify-end">
          <Button variant="primary" className="min-h-11" isDisabled={!noteDirty} isPending={mutations.update.isPending} onPress={saveNote}>Save note</Button>
        </div>
      </section>
    </AdminPage>
  );
}

export function FeedbackDetail({ reference }: { reference: string }) {
  const query = useFeedbackTicketQuery(reference);
  const ticket = query.data;
  if (query.isError && !ticket) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return <AdminPage><PageHeader title="Feedback" /><AdminErrorState title={notFound ? "Ticket not found" : "Couldn’t load the ticket"} description={query.error instanceof ApiError ? query.error.message : "Try again in a moment."} onRetry={notFound ? undefined : () => void query.refetch()} /></AdminPage>;
  }
  if (!ticket) return <AdminPage><PageHeader title="Feedback" /><AdminLoadingState label="Loading ticket…" /></AdminPage>;
  return <Workspace key={ticket.reference} ticket={ticket} />;
}
