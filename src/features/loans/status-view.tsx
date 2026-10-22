"use client";

import { CheckCircleIcon, FileMagnifyingGlassIcon, WarningCircleIcon, WarningIcon, XCircleIcon } from "@phosphor-icons/react";
import { InfoIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppBar } from "@/components/shared/app-bar";
import { DesktopTitle, Screen } from "@/components/shared/screen";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toast";
import { formatDay } from "@/features/bookings/dates";
import { formatMoney } from "@/lib/format";
import {
  type DocumentId,
  type LoanStatus,
  type StoredFile,
  documentTypes,
  employmentTypes,
  experienceBands,
  getLoanType,
  labelOf,
  labelOfDocument,
  loanPurposes,
  residenceStatuses,
  statusMeta,
} from "./data";
import { DocumentUpload } from "./document-upload";
import { LoanTimeline } from "./loan-timeline";
import { addAdditionalDocument, justAppliedStore, loansStore, provideDocuments } from "./store";

const headlines: Record<LoanStatus, string> = {
  submitted: "Application submitted",
  "in-review": "Application in review",
  "documents-required": "Documents needed",
  approved: "Application approved",
  rejected: "Application not approved",
};

const headIcon: Record<LoanStatus, React.ReactNode> = {
  submitted: <CheckCircleIcon size={26} weight="fill" className="text-[#22c55e]" />,
  "in-review": <CheckCircleIcon size={26} weight="fill" className="text-[#22c55e]" />,
  "documents-required": <WarningCircleIcon size={26} weight="fill" className="text-brand" />,
  approved: <CheckCircleIcon size={26} weight="fill" className="text-[#22c55e]" />,
  rejected: <XCircleIcon size={26} weight="fill" className="text-[#f87171]" />,
};

function Card({ title, id, children }: { title: string; id: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-card border border-line bg-surface p-4 shadow-card">
      <h2 id={id} className="mb-3 text-base font-bold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-subtle">{label}</dt>
      <dd className="text-right font-semibold wrap-break-word">{value}</dd>
    </div>
  );
}

export function LoanStatusView({ reference }: { reference: string }) {
  const router = useRouter();
  const application = loansStore.useValue().find((a) => a.reference === reference);
  const justApplied = justAppliedStore.useValue();
  const [files, setFiles] = useState<Partial<Record<DocumentId, StoredFile>>>({});
  const [extraOpen, setExtraOpen] = useState(false);

  const back = justApplied === reference ? () => router.replace("/loans") : undefined;

  if (!application) {
    return (
      <>
        <AppBar leading="back" backFallback="/loans" title="Application status" />
        <Screen enter="slide">
          <EmptyState
            icon={<FileMagnifyingGlassIcon size={24} />}
            title="Application not found"
            description="We could not find that reference on this device."
            action={
              <ButtonLink href="/loans" size="sm">
                Back to loans
              </ButtonLink>
            }
          />
        </Screen>
      </>
    );
  }

  const type = getLoanType(application.loanType);
  const meta = statusMeta[application.status];
  const needed = application.requestedDocuments;
  const ready = needed.length > 0 && needed.every((id) => files[id]);
  const open = application.status === "submitted" || application.status === "in-review";
  const created = new Date(application.createdAt);

  return (
    <>
      <AppBar leading="back" backFallback="/loans" onBack={back} title="Application status" subtitle={application.reference} />
      <Screen enter="slide" className="flex flex-col gap-5 md:max-w-3xl">
        <DesktopTitle title="Application status" subtitle={application.reference} />

        <section aria-label="Status" className="flex flex-col gap-4 rounded-card bg-ink p-4 text-white md:p-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0">{headIcon[application.status]}</span>
            <div>
              <p className="text-lg leading-6 font-extrabold" data-testid="status-headline">
                {headlines[application.status]}
              </p>
              <p className="mt-1 text-sm leading-6 text-white/75" data-testid="status-summary">
                {meta.summary}
              </p>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3 rounded-control bg-white/10 p-3 text-sm">
            <div>
              <dt className="text-xs text-white/60">Reference no.</dt>
              <dd data-testid="loan-ref" className="tabular font-bold">
                {application.reference}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-white/60">Submitted on</dt>
              <dd className="tabular font-bold">
                {formatDay(application.createdAt.slice(0, 10))}, {created.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-white/60">Loan</dt>
              <dd className="font-bold">{type?.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-white/60">Amount</dt>
              <dd className="tabular font-bold">
                {formatMoney(application.amount)} · {formatMoney(application.emi)}/mo
              </dd>
            </div>
          </dl>
        </section>

        {application.status === "documents-required" && needed.length > 0 ? (
          <section aria-labelledby="needed" className="flex flex-col gap-3 rounded-card border border-brand bg-brand-soft p-4">
            <div className="flex items-start gap-3">
              <WarningIcon size={22} className="mt-0.5 shrink-0" />
              <div>
                <h2 id="needed" className="text-base font-bold">
                  Documents requested
                </h2>
                <p className="text-sm leading-6 text-ink/75">Please add: {needed.map(labelOfDocument).join(", ")}.</p>
              </div>
            </div>
            {needed.map((id) => {
              const doc = documentTypes.find((d) => d.id === id)!;
              return (
                <DocumentUpload
                  key={id}
                  doc={id}
                  requested
                  label={doc.label}
                  hint={doc.hint}
                  file={files[id]}
                  onChange={(file) =>
                    setFiles((current) => {
                      const next = { ...current };
                      if (file) next[id] = file;
                      else delete next[id];
                      return next;
                    })
                  }
                />
              );
            })}
            <Button
              fullWidth
              size="lg"
              isDisabled={!ready}
              onPress={() => {
                provideDocuments(application.reference, files);
                setFiles({});
                toast.success("Documents sent", { description: "Your application is back in review." });
              }}
            >
              Send documents
            </Button>
          </section>
        ) : null}

        <Card title="Application timeline" id="progress">
          <LoanTimeline application={application} />
        </Card>

        <p className="flex items-start gap-2 rounded-control bg-surface-secondary px-4 py-3 text-xs leading-5 text-subtle">
          <InfoIcon size={16} className="mt-0.5 shrink-0" />
          We will notify you once there is an update. You can also check your status anytime here.
        </p>

        <Card title="Application" id="details">
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="Tenure" value={`${application.tenure} months`} />
            <Row label="Purpose" value={labelOf(loanPurposes, application.purpose)} />
            <Row label="Applicant" value={application.applicant.fullName} />
            <Row label="City" value={application.applicant.city} />
            <Row label="Residence" value={labelOf(residenceStatuses, application.applicant.residence)} />
            <Row label="Employment" value={`${labelOf(employmentTypes, application.employment.type)}, ${application.employment.employer}`} />
            <Row label="Job title" value={`${application.employment.jobTitle} (${labelOf(experienceBands, application.employment.experience)})`} />
            <Row label="Monthly income" value={formatMoney(application.employment.monthlyIncome)} />
          </dl>
        </Card>

        <Card title="Documents" id="documents">
          <dl className="flex flex-col gap-2 text-sm">
            {documentTypes.map((doc) => (
              <Row key={doc.id} label={doc.label} value={application.documents[doc.id]?.name ?? (needed.includes(doc.id) ? "Requested" : "Not provided")} />
            ))}
          </dl>
        </Card>

        {open ? (
          <div className="flex flex-col gap-3">
            {extraOpen ? (
              <DocumentUpload
                label="Additional document"
                hint="Anything that supports your application"
                file={undefined}
                onChange={(file) => {
                  if (!file) return;
                  addAdditionalDocument(application.reference, file);
                  setExtraOpen(false);
                  toast.success("Document received", { description: file.name });
                }}
              />
            ) : (
              <Button size="lg" fullWidth onPress={() => setExtraOpen(true)}>
                Upload additional document
              </Button>
            )}
          </div>
        ) : null}

        {application.status === "rejected" || application.status === "approved" ? (
          <ButtonLink href="/loans/apply" variant={application.status === "approved" ? "outline" : "primary"} size="lg" fullWidth>
            {application.status === "approved" ? "Apply for another loan" : "Apply again"}
          </ButtonLink>
        ) : null}

        <ButtonLink href="/help" variant="outline" size="lg" fullWidth>
          Contact support
        </ButtonLink>
      </Screen>
    </>
  );
}
