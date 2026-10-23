"use client";

import { Button, Drawer, useOverlayState } from "@heroui/react";
import { ArrowRightIcon, BankIcon, BriefcaseIcon, CakeIcon, CalendarCheckIcon, EnvelopeSimpleIcon, EyeIcon, FileTextIcon, FlagIcon, HouseLineIcon, IdentificationCardIcon, MapPinIcon, PhoneIcon, TimerIcon, UserCircleIcon, WalletIcon, XCircleIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { CustomerAvatar } from "@/components/admin/customers/customer-avatar";
import { ActivityTimeline, type ActivityItem, MoneyDisplay } from "@/components/admin/data-display/misc";
import { AdminErrorState } from "@/components/admin/feedback";
import { AdminPage, PageHeader } from "@/components/admin/layout";
import { CurrencyAmount } from "@/components/admin/money";
import { AdminBreadcrumbs, AdminTabs } from "@/components/admin/navigation";
import { cn } from "@/lib/cn";
import { ApproveLoanDialog, RejectLoanDialog, RequestDocumentsDrawer } from "./loan-dialogs";
import { canApprove, canReject, canRequestDocuments, type DocumentType, fmtDate, fmtDateTime, getLoan, type Loan, type LoanDocument, type LoanEvent, NOW } from "./loan-data";
import { DocumentStatusBadge, LoanStatusBadge } from "./loan-parts";

function Card({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section aria-label={title} className={cn("adminSurface rounded-2xl p-4 sm:p-5", className)}>
      <header className="mb-4 flex items-center justify-between gap-3"><h2 className="text-sm font-extrabold">{title}</h2>{action}</header>
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

const ageOf = (iso: string) => Math.floor((NOW - Date.parse(iso)) / (365.25 * 86_400_000));

function settle(events: LoanEvent[]) {
  return events.filter((event) => event.state !== "future").map((event) => (event.state === "current" ? { ...event, state: "done" as const } : event));
}

export function LoanDetail({ reference }: { reference: string }) {
  const router = useRouter();
  const requestDrawer = useOverlayState();
  const approveDialog = useOverlayState();
  const rejectDialog = useOverlayState();
  const [overrides, setOverrides] = useState<Partial<Loan>>({});
  const [tab, setTab] = useState("overview");
  const [previewing, setPreviewing] = useState<LoanDocument | null>(null);
  const base = getLoan(reference);

  if (!base) return <AdminPage><PageHeader title="Loan Application" /><AdminErrorState title="Application not found" description="This UI preview does not contain that loan application." /></AdminPage>;
  const loan: Loan = { ...base, ...overrides };
  const { applicant, employment } = loan;
  const verified = loan.documents.filter((doc) => doc.status === "verified").length;
  const now = new Date(NOW).toISOString();

  const timeline: ActivityItem[] = loan.history.map((event) => ({ id: event.id, title: event.title, detail: event.detail, state: event.state, time: event.at ? `${fmtDateTime(event.at)} ICT` : "Pending" }));

  const actions = (
    <>
      {canRequestDocuments(loan.status) ? <Button variant="outline" className="min-h-11 flex-1 lg:flex-none" onPress={requestDrawer.open}><FileTextIcon />Request Documents</Button> : null}
      {canReject(loan.status) ? <Button variant="danger" className="min-h-11 flex-1 lg:flex-none" onPress={rejectDialog.open}><XCircleIcon />Reject</Button> : null}
      {canApprove(loan.status) ? <Button variant="primary" className="min-h-11 flex-1 lg:flex-none" onPress={approveDialog.open}>Approve</Button> : null}
    </>
  );
  const hasActions = canRequestDocuments(loan.status) || canReject(loan.status) || canApprove(loan.status);

  const overview = (
    <div className="grid items-start gap-4 lg:grid-cols-2 xl:gap-5">
      <Card title="Applicant" action={<Button size="sm" variant="ghost" className="min-h-11 text-[var(--admin-info)] md:min-h-9" onPress={() => router.push(`/admin/customers/${applicant.customerId}`)}>View customer<ArrowRightIcon size={14} /></Button>}>
        <div className="mb-4 flex items-center gap-3"><CustomerAvatar name={applicant.name} size="md" /><div className="min-w-0"><p className="truncate text-sm font-extrabold">{applicant.name}</p><p className="text-xs text-[var(--admin-muted)]">{applicant.customerReference}</p></div></div>
        <dl className="space-y-4"><Row icon={<PhoneIcon size={18} />} label="Phone">{applicant.phone}</Row><Row icon={<EnvelopeSimpleIcon size={18} />} label="Email">{applicant.email}</Row><Row icon={<MapPinIcon size={18} />} label="Current city">{applicant.city}, Cambodia</Row></dl>
      </Card>
      <Card title="Employment & Income">
        <dl className="space-y-4">
          <Row icon={<BriefcaseIcon size={18} />} label="Employment">{employment.type} · {employment.employer}</Row>
          <Row icon={<WalletIcon size={18} />} label="Monthly income"><MoneyDisplay amount={employment.monthlyIncomeMinor} /> <span className="text-xs font-medium text-[var(--admin-muted)]">USD</span></Row>
          <Row icon={<BankIcon size={18} />} label="Active bank account">{employment.activeBankAccount ? "Yes" : "No"}</Row>
        </dl>
      </Card>
      <Card title="Document progress" action={<Button size="sm" variant="ghost" className="min-h-11 text-[var(--admin-info)] md:min-h-9" onPress={() => setTab("documents")}>Open checklist<ArrowRightIcon size={14} /></Button>}>
        <p className="text-sm"><strong className="text-lg font-extrabold">{verified}</strong> <span className="text-[var(--admin-muted)]">of {loan.documents.length} documents verified</span></p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--admin-surface-muted)]" role="progressbar" aria-valuemin={0} aria-valuemax={loan.documents.length} aria-valuenow={verified} aria-label="Verified documents"><div className="h-full rounded-full bg-[var(--admin-success)] transition-[width]" style={{ width: `${(verified / loan.documents.length) * 100}%` }} /></div>
      </Card>
      <Card title="Latest activity" action={<Button size="sm" variant="ghost" className="min-h-11 text-[var(--admin-info)] md:min-h-9" onPress={() => setTab("history")}>Status history<ArrowRightIcon size={14} /></Button>}>
        <ActivityTimeline items={timeline.filter((item) => item.state !== "future").slice(-2)} />
      </Card>
    </div>
  );

  return (
    <AdminPage className="gap-5">
      <AdminBreadcrumbs items={[{ label: "Loan Applications", href: "/admin/loans" }, { label: loan.reference }]} />

      <header className="adminHero flex flex-col gap-4 rounded-3xl p-4 sm:p-5 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{loan.reference}</h1>
            <LoanStatusBadge status={loan.status} />
          </div>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">{applicant.name} · Submitted on {fmtDateTime(loan.submittedAt)} (Asia/Phnom_Penh)</p>
        </div>
        <div className="hidden gap-2 lg:flex">{actions}</div>
      </header>

      <section aria-label="Loan details" className="adminSurface grid gap-4 rounded-2xl p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-[1.4fr_1fr_1fr_1.4fr]">
        <div><p className="text-[11px] font-medium text-[var(--admin-muted)]">Requested amount</p><CurrencyAmount amount={loan.requestedMinor} currency={loan.currency} showCode className="text-2xl font-extrabold" /></div>
        <div><p className="text-[11px] font-medium text-[var(--admin-muted)]">Loan type</p><p className="text-sm font-bold">{loan.loanType}</p></div>
        <div><p className="flex items-center gap-1 text-[11px] font-medium text-[var(--admin-muted)]"><TimerIcon size={12} aria-hidden />Tenure</p><p className="text-sm font-bold">{loan.tenureMonths} months</p><p className="text-[11px] text-[var(--admin-muted)]">Currency: {loan.currency}</p></div>
        <div><p className="text-[11px] font-medium text-[var(--admin-muted)]">Purpose</p><p className="text-sm font-semibold">{loan.purpose}</p></div>
      </section>

      <AdminTabs label="Loan application" selectedKey={tab} onSelectionChange={setTab} items={[
        { id: "overview", label: "Overview", content: overview },
        { id: "applicant", label: "Applicant", content: (
          <Card title="Applicant details"><dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Row icon={<UserCircleIcon size={18} />} label="Full name">{applicant.name}</Row><Row icon={<PhoneIcon size={18} />} label="Phone">{applicant.phone}</Row><Row icon={<EnvelopeSimpleIcon size={18} />} label="Email">{applicant.email}</Row>
            <Row icon={<CakeIcon size={18} />} label="Date of birth">{fmtDate(applicant.dateOfBirth)} ({ageOf(applicant.dateOfBirth)} years)</Row><Row icon={<FlagIcon size={18} />} label="Nationality">{applicant.nationality}</Row><Row icon={<MapPinIcon size={18} />} label="Current city">{applicant.city}</Row>
            <Row icon={<HouseLineIcon size={18} />} label="Address">{applicant.address}</Row><Row icon={<IdentificationCardIcon size={18} />} label="Residence status">{applicant.residence}</Row>
          </dl></Card>
        ) },
        { id: "employment", label: "Employment", content: (
          <Card title="Employment & income"><dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Row icon={<BriefcaseIcon size={18} />} label="Employment type">{employment.type}</Row><Row icon={<BriefcaseIcon size={18} />} label="Employer">{employment.employer}</Row><Row icon={<IdentificationCardIcon size={18} />} label="Job title">{employment.jobTitle}</Row>
            <Row icon={<WalletIcon size={18} />} label="Monthly income"><MoneyDisplay amount={employment.monthlyIncomeMinor} /> <span className="text-xs font-medium text-[var(--admin-muted)]">USD</span></Row><Row icon={<CalendarCheckIcon size={18} />} label="Work experience">{employment.experienceYears} years</Row><Row icon={<BankIcon size={18} />} label="Active bank account">{employment.activeBankAccount ? "Yes" : "No"}</Row>
          </dl></Card>
        ) },
        { id: "documents", label: "Documents", content: (
          <Card title="Document checklist" action={<span className="text-xs font-semibold text-[var(--admin-muted)]">{verified}/{loan.documents.length} verified</span>}>
            <ul className="divide-y divide-[var(--admin-border)]">
              {loan.documents.map((doc) => (
                <li key={doc.type} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-surface-muted)] text-[var(--admin-muted)]"><FileTextIcon size={20} weight="duotone" aria-hidden /></span>
                  <div className="min-w-0 flex-1"><p className="text-sm font-bold">{doc.type}</p><p className="text-xs text-[var(--admin-muted)]">{doc.uploadedAt ? `Uploaded ${fmtDateTime(doc.uploadedAt)} ICT` : "Not uploaded yet"}</p></div>
                  <DocumentStatusBadge status={doc.status} />
                  <div className="flex w-full justify-end gap-1.5 sm:w-auto">
                    {doc.status === "missing" ? (canRequestDocuments(loan.status) ? <Button size="sm" variant="outline" className="min-h-11 md:min-h-8" onPress={requestDrawer.open}>Request Document</Button> : null) : (
                      <>
                        <Button size="sm" variant="ghost" className="min-h-11 md:min-h-8" onPress={() => setPreviewing(doc)}><EyeIcon size={15} />Preview</Button>
                        <Button size="sm" variant="outline" className="min-h-11 md:min-h-8" onPress={() => router.push(`/admin/documents/${doc.detailId}`)}>Review</Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ) },
        { id: "history", label: "Status History", content: <Card title="Status history"><ActivityTimeline items={timeline} /></Card> },
      ]} />

      {hasActions ? <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-[var(--admin-border)] bg-white/95 p-3 backdrop-blur-md lg:hidden">{actions}</div> : null}
      {hasActions ? <div className="h-16 lg:hidden" aria-hidden /> : null}

      <RequestDocumentsDrawer loan={loan} isOpen={requestDrawer.isOpen} onOpenChange={requestDrawer.setOpen} onConfirm={(_, types: DocumentType[], note) => setOverrides((current) => ({ ...current, status: "action-required", history: [...settle(loan.history), { id: `request-${types.length}`, title: "Additional documents requested", detail: note.trim() || types.join(", "), at: now, state: "current" }, { id: "elig", title: "Eligibility review", at: null, state: "future" }, { id: "decision", title: "Decision", at: null, state: "future" }] }))} />
      <ApproveLoanDialog loan={loan} isOpen={approveDialog.isOpen} onOpenChange={approveDialog.setOpen} onConfirm={(_, note) => setOverrides((current) => ({ ...current, status: "approved", history: [...settle(loan.history), { id: "decision", title: "Application approved", detail: note.trim() || undefined, at: now, state: "done" }] }))} />
      <RejectLoanDialog loan={loan} isOpen={rejectDialog.isOpen} onOpenChange={rejectDialog.setOpen} onConfirm={(_, reason, note) => setOverrides((current) => ({ ...current, status: "rejected", history: [...settle(loan.history), { id: "decision", title: "Application rejected", detail: [reason, note.trim()].filter(Boolean).join(" — "), at: now, state: "failed" }] }))} />

      <Drawer.Backdrop isOpen={Boolean(previewing)} onOpenChange={(open) => !open && setPreviewing(null)} className="adminOverlay">
        <Drawer.Content placement="right" className="w-full max-w-md">
          <Drawer.Dialog aria-label="Document preview">
            <Drawer.CloseTrigger />
            <Drawer.Header><Drawer.Heading>{previewing?.type ?? "Document"}</Drawer.Heading></Drawer.Header>
            <Drawer.Body className="space-y-4">
              <div className="adminTile flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl text-center text-[var(--admin-muted)]"><FileTextIcon size={36} weight="duotone" /><p className="px-6 text-sm">Document previews are not available in this demo.</p></div>
              {previewing ? <dl className="space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-[var(--admin-muted)]">Application</dt><dd className="font-semibold">{loan.reference}</dd></div><div className="flex justify-between gap-3"><dt className="text-[var(--admin-muted)]">Uploaded</dt><dd className="font-semibold">{previewing.uploadedAt ? `${fmtDateTime(previewing.uploadedAt)} ICT` : "—"}</dd></div><div className="flex items-center justify-between gap-3"><dt className="text-[var(--admin-muted)]">Status</dt><dd><DocumentStatusBadge status={previewing.status} /></dd></div></dl> : null}
            </Drawer.Body>
            <Drawer.Footer><Button variant="primary" className="min-h-11" onPress={() => previewing && router.push(`/admin/documents/${previewing.detailId}`)}>Open Document Review</Button></Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </AdminPage>
  );
}
