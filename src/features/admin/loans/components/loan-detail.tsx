"use client";

import { Button, useOverlayState } from "@heroui/react";
import { ArrowsClockwiseIcon, ArrowRightIcon, BankIcon, BriefcaseIcon, CakeIcon, CalendarCheckIcon, DownloadSimpleIcon, EnvelopeSimpleIcon, FileTextIcon, FlagIcon, IdentificationCardIcon, MapPinIcon, PhoneIcon, TimerIcon, WalletIcon, XCircleIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { ActivityTimeline, type ActivityItem } from "@/components/admin/data-display/misc";
import { AdminErrorState, AdminLoadingState } from "@/components/admin/feedback";
import { AdminPage, PageHeader } from "@/components/admin/layout";
import { LoanStatusBadge } from "@/components/admin/loans/loan-parts";
import { CurrencyAmount } from "@/components/admin/money";
import { AdminBreadcrumbs, AdminTabs } from "@/components/admin/navigation";
import { useNow } from "@/features/admin/bookings/hooks/use-now";
import { documentFileUrl } from "@/features/admin/documents/api/documents-api";
import { ReviewStatusBadge } from "@/features/admin/documents/components/document-parts";
import { ApiError } from "@/lib/api/error";
import { cn } from "@/lib/cn";
import { useLoanActions } from "../hooks/use-loan-actions";
import { useLoanQuery } from "../hooks/use-loans";
import { ageOf, canMoveTo, documentTypeLabel, employmentLabels, loanDocumentPath, loanStatusLabels, loanTypeLabel, monthsToYears, requiredDocumentTypes, residenceLabels, reviewStatusOptions } from "../lib/loan-model";
import type { Loan, LoanDocument } from "../types/loan";
import { ApproveLoanDialog, RejectLoanDialog, RequestDocumentsDrawer, UpdateLoanStatusModal } from "./loan-dialogs";
import { fmtDate, fmtDateTime } from "./loan-format";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";
import { adminT } from "@/features/admin/i18n/translate";

function Card({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section aria-label={title} className={cn("adminSurface flex h-full flex-col rounded-2xl p-4 sm:p-5", className)}>
      <header className="mb-4 flex min-h-9 items-center justify-between gap-3"><h2 className="text-sm font-extrabold">{title}</h2>{action}</header>
      {children}
    </section>
  );
}

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-surface-muted)] text-[var(--admin-muted)]">{icon}</span>
      <div className="min-w-0 flex-1"><dt className="text-[11px] font-medium text-[var(--admin-muted)]">{label}</dt><dd className="break-words text-sm font-semibold">{children}</dd></div>
    </div>
  );
}

const dash = "—";

function buildTimeline(loan: Loan): ActivityItem[] {
  return loan.history.map((entry, index, all) => {
    const last = index === all.length - 1;
    const state = entry.newStatus === "rejected" ? "failed" : last && entry.newStatus !== "approved" ? "current" : "done";
    const title = entry.newStatus === "draft" ? adminT("loans.detail.started") : loanStatusLabels[entry.newStatus];
    const detail = [entry.changedByName && entry.oldStatus !== null ? adminT("loans.detail.by", { name: entry.changedByName }) : null, entry.note].filter(Boolean).join(" — ") || undefined;
    return { id: `${entry.newStatus}-${entry.createdAt}-${index}`, title, detail, state, time: `${fmtDateTime(entry.createdAt)} ICT` };
  });
}

export function LoanDetail({ reference }: { reference: string }) {
  const t = useAdminTranslations();
  const query = useLoanQuery(reference);
  const loan = query.data;
  if (query.isError && !loan) {
    const notFound = query.error instanceof ApiError && (query.error.status === 404 || query.error.status === 422);
    return <AdminPage><PageHeader title={t("pages.loans.detail")} /><AdminErrorState title={notFound ? t("loans.detail.notFound") : t("loans.detail.appLoadError")} description={query.error instanceof ApiError ? query.error.message : t("common.retryLater")} onRetry={notFound ? undefined : () => void query.refetch()} /></AdminPage>;
  }
  if (!loan) return <AdminPage><PageHeader title={t("pages.loans.detail")} /><AdminLoadingState label={t("loans.detail.loadingApp")} /></AdminPage>;
  return <LoanWorkspace loan={loan} />;
}

function LoanWorkspace({ loan }: { loan: Loan }) {
  const t = useAdminTranslations();
  const router = useRouter();
  const actions = useLoanActions();
  const now = useNow(60_000);
  const requestDrawer = useOverlayState();
  const statusModal = useOverlayState();
  const approveDialog = useOverlayState();
  const rejectDialog = useOverlayState();
  const [tab, setTab] = useState("overview");
  const { applicant, employment } = loan;

  const reviewable = reviewStatusOptions(loan).length > 0;
  const canRequest = canMoveTo(loan, "additional_documents_required");
  const canReject = canMoveTo(loan, "rejected");
  const canApprove = canMoveTo(loan, "approved");
  const hasActions = reviewable || canRequest || canReject || canApprove;
  const actionCount = Number(reviewable) + Number(canRequest) + Number(canReject) + Number(canApprove);
  const confirm = (target: Pick<Loan, "reference">, input: Parameters<typeof actions.changeStatus>[1]) => actions.changeStatus(target, input);

  const latestOf = (type: string): LoanDocument | undefined => loan.documents.filter((doc) => doc.type === type).at(-1);
  const checklist = [...requiredDocumentTypes.map((type) => ({ type, doc: latestOf(type) })), ...loan.documents.filter((doc) => doc.type === "other").map((doc) => ({ type: doc.type, doc }))];
  const verified = checklist.filter((entry) => entry.doc?.verificationStatus === "verified").length;

  const actionButtons = (
    <>
      {reviewable ? <Button variant="outline" className="min-h-11 flex-1 lg:flex-none" onPress={statusModal.open}><ArrowsClockwiseIcon />{t("loans.detail.updateStatus")}</Button> : null}
      {canRequest ? <Button variant="outline" className="min-h-11 flex-1 lg:flex-none" onPress={requestDrawer.open}><FileTextIcon />{t("loans.detail.requestDocuments")}</Button> : null}
      {canReject ? <Button variant="danger" className="min-h-11 flex-1 lg:flex-none" onPress={rejectDialog.open}><XCircleIcon />{t("loans.detail.reject")}</Button> : null}
      {canApprove ? <Button variant="primary" className="min-h-11 flex-1 lg:flex-none" onPress={approveDialog.open}>{t("loans.detail.approve")}</Button> : null}
    </>
  );

  const applicantCard = (
    <Card title={t("loans.detail.applicant")} action={<Button size="sm" variant="ghost" className="min-h-11 text-[var(--admin-accent-strong)] md:min-h-9" onPress={() => router.push(`/admin/customers/${loan.userId}`)}>{t("loans.detail.viewCustomer")}<ArrowRightIcon size={14} /></Button>}>
      <div className="mb-4 flex items-center gap-3"><CustomerAvatar name={loan.customer.name} size="md" /><div className="min-w-0"><p className="truncate text-sm font-extrabold">{applicant.fullName ?? loan.customer.name}</p><p className="text-xs text-[var(--admin-muted)]">{loan.customer.reference}</p></div></div>
      <dl className="grid gap-4 sm:grid-cols-2">
        <Row icon={<PhoneIcon size={18} />} label={t("loans.detail.phone")}>{applicant.mobile ?? loan.customer.phone ?? dash}</Row>
        <Row icon={<EnvelopeSimpleIcon size={18} />} label={t("loans.detail.email")}>{applicant.email ?? loan.customer.email ?? dash}</Row>
        <Row icon={<CakeIcon size={18} />} label={t("loans.detail.dob")}>{applicant.dateOfBirth ? t("loans.detail.age", { date: fmtDate(applicant.dateOfBirth), age: ageOf(applicant.dateOfBirth, now) }) : dash}</Row>
        <Row icon={<FlagIcon size={18} />} label={t("loans.detail.nationality")}>{applicant.nationality ?? dash}</Row>
        <Row icon={<MapPinIcon size={18} />} label={t("loans.detail.currentCity")}>{applicant.currentCity ? t("loans.detail.cityCountry", { city: applicant.currentCity }) : dash}</Row>
        <Row icon={<IdentificationCardIcon size={18} />} label={t("loans.detail.residence")}>{applicant.residenceStatus ? residenceLabels[applicant.residenceStatus] ?? applicant.residenceStatus : dash}</Row>
      </dl>
    </Card>
  );

  const employmentCard = (
    <Card title={t("loans.detail.employmentIncome")}>
      <dl className="grid gap-4 sm:grid-cols-2">
        <Row icon={<BriefcaseIcon size={18} />} label={t("loans.detail.employmentType")}>{employment.employmentType ? employmentLabels[employment.employmentType] ?? employment.employmentType : dash}</Row>
        <Row icon={<BriefcaseIcon size={18} />} label={t("loans.detail.employer")}>{employment.employerName ?? dash}</Row>
        <Row icon={<IdentificationCardIcon size={18} />} label={t("loans.detail.jobTitle")}>{employment.jobTitle ?? dash}</Row>
        <Row icon={<WalletIcon size={18} />} label={t("loans.detail.monthlyIncome")}>{employment.monthlyIncomeMinor === null ? dash : <><CurrencyAmount amount={employment.monthlyIncomeMinor} currency={loan.currency} /> <span className="text-xs font-medium text-[var(--admin-muted)]">{loan.currency}</span></>}</Row>
        <Row icon={<CalendarCheckIcon size={18} />} label={t("loans.detail.experience")}>{employment.workExperienceMonths === null ? dash : monthsToYears(employment.workExperienceMonths)}</Row>
        <Row icon={<BankIcon size={18} />} label={t("loans.detail.bankAccount")}>{employment.hasActiveBankAccount === null ? dash : employment.hasActiveBankAccount ? t("common.yes") : t("common.no")}</Row>
      </dl>
    </Card>
  );

  const documentsCard = (
    <Card title={t("loans.detail.checklist")} action={<span className="text-xs font-semibold text-[var(--admin-muted)]">{t("loans.detail.verifiedCount", { verified, total: checklist.length })}</span>}>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-[var(--admin-surface-muted)]" role="progressbar" aria-valuemin={0} aria-valuemax={checklist.length} aria-valuenow={verified} aria-label={t("loans.detail.verifiedDocs")}><div className="h-full rounded-full bg-[var(--admin-success)] transition-[width]" style={{ width: `${checklist.length ? (verified / checklist.length) * 100 : 0}%` }} /></div>
      <ul className="divide-y divide-[var(--admin-border)]">
        {checklist.map(({ type, doc }) => (
          <li key={doc?.id ?? type} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-surface-muted)] text-[var(--admin-muted)]"><FileTextIcon size={20} weight="duotone" aria-hidden /></span>
            <div className="min-w-0 flex-1"><p className="text-sm font-bold">{documentTypeLabel(type)}</p><p className="text-xs text-[var(--admin-muted)]">{doc ? t("loans.detail.uploadedAt", { date: fmtDateTime(doc.uploadedAt) }) : t("loans.detail.notUploaded")}</p>{doc?.reviewNote ? <p className="mt-0.5 text-xs text-[var(--admin-muted)]">{t("loans.detail.note", { note: doc.reviewNote })}</p> : null}</div>
            {doc ? <ReviewStatusBadge status={doc.verificationStatus} /> : <span className="rounded-full bg-[var(--admin-danger-soft)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--admin-danger)]">{t("loans.detail.missing")}</span>}
            <div className="flex w-full justify-end gap-1.5 sm:w-auto">
              {doc ? (
                <>
                  <a href={documentFileUrl(loanDocumentPath(loan.reference, doc.id))} target="_blank" rel="noopener noreferrer" aria-label={t("loans.detail.openFile", { name: doc.originalFilename })} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-xs font-bold text-[var(--admin-accent-strong)] outline-none hover:bg-[var(--admin-surface-muted)] focus-visible:ring-2 focus-visible:ring-[var(--admin-accent-strong)] md:min-h-8"><DownloadSimpleIcon size={15} />{t("loans.detail.open")}</a>
                  <Button size="sm" variant="outline" className="min-h-11 md:min-h-8" onPress={() => router.push(`/admin/documents/${doc.id}`)}>{t("loans.detail.review")}</Button>
                </>
              ) : canRequest ? <Button size="sm" variant="outline" className="min-h-11 md:min-h-8" onPress={requestDrawer.open}>{t("loans.detail.requestDocument")}</Button> : null}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );

  const historyCard = <Card title={t("loans.detail.history")}><ActivityTimeline items={buildTimeline(loan)} /></Card>;

  const overview = (
    <div className="space-y-4 xl:space-y-5">
      <div className="grid items-stretch gap-4 lg:grid-cols-2 xl:gap-5">{applicantCard}{employmentCard}</div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] xl:gap-5">{documentsCard}{historyCard}</div>
    </div>
  );

  return (
    <AdminPage className="gap-5">
      <AdminBreadcrumbs items={[{ label: t("pages.loans.title"), href: "/admin/loans" }, { label: loan.reference }]} />

      <header className="adminHero rounded-3xl p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{loan.reference}</h1>
              <LoanStatusBadge status={loan.status} />
            </div>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">{loan.customer.name} · {loan.submittedAt ? t("loans.detail.submittedOn", { date: fmtDateTime(loan.submittedAt) }) : t("loans.detail.startedOn", { date: fmtDateTime(loan.createdAt) })} {t("loans.detail.timezone")}</p>
          </div>
          <div className="hidden gap-2 lg:flex">{actionButtons}</div>
        </div>
        <dl aria-label={t("loans.detail.loanDetails")} className="mt-4 grid gap-x-6 gap-y-4 border-t border-[var(--admin-border)] pt-4 sm:grid-cols-2 xl:grid-cols-4">
          <div><dt className="text-[11px] font-medium text-[var(--admin-muted)]">{t("loans.detail.requestedAmount")}</dt><dd><CurrencyAmount amount={loan.requestedAmountMinor} currency={loan.currency} showCode className="text-2xl font-extrabold" /></dd></div>
          <div><dt className="text-[11px] font-medium text-[var(--admin-muted)]">{t("loans.detail.loanType")}</dt><dd className="text-sm font-bold">{loanTypeLabel(loan.loanType)}</dd></div>
          <div><dt className="flex items-center gap-1 text-[11px] font-medium text-[var(--admin-muted)]"><TimerIcon size={12} aria-hidden />{t("loans.detail.tenure")}</dt><dd className="text-sm font-bold">{t("loans.months", { count: loan.tenureMonths })} <span className="text-xs font-medium text-[var(--admin-muted)]">· {loan.currency}</span></dd></div>
          <div><dt className="text-[11px] font-medium text-[var(--admin-muted)]">{t("loans.detail.purpose")}</dt><dd className="text-sm font-semibold">{loan.purpose ?? dash}</dd></div>
        </dl>
      </header>

      <AdminTabs label={t("loans.detail.application")} selectedKey={tab} onSelectionChange={setTab} items={[
        { id: "overview", label: t("loans.detail.tabs.overview"), content: overview },
        { id: "applicant", label: t("loans.detail.tabs.applicant"), content: applicantCard },
        { id: "employment", label: t("loans.detail.tabs.employment"), content: employmentCard },
        { id: "documents", label: t("loans.detail.tabs.documents"), content: documentsCard },
        { id: "history", label: t("loans.detail.tabs.history"), content: historyCard },
      ]} />

      {hasActions ? <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 gap-2 border-t border-[var(--admin-border)] bg-white/95 p-3 backdrop-blur-md lg:hidden">{actionButtons}</div> : null}
      {hasActions ? <div className={cn(actionCount > 2 ? "h-32" : "h-20", "lg:hidden")} aria-hidden /> : null}

      <UpdateLoanStatusModal loan={loan} isOpen={statusModal.isOpen} onOpenChange={statusModal.setOpen} onConfirm={confirm} />
      <RequestDocumentsDrawer loan={loan} isOpen={requestDrawer.isOpen} onOpenChange={requestDrawer.setOpen} onConfirm={confirm} />
      <ApproveLoanDialog loan={loan} isOpen={approveDialog.isOpen} onOpenChange={approveDialog.setOpen} onConfirm={confirm} />
      <RejectLoanDialog loan={loan} isOpen={rejectDialog.isOpen} onOpenChange={rejectDialog.setOpen} onConfirm={confirm} />
    </AdminPage>
  );
}
