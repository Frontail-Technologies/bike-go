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
import { useLoanText } from "./use-loan-text";
import {
  type DocumentId,
  type LoanStatus,
  type StoredFile,
  documentTypes,
} from "./data";
import { DocumentUpload } from "./document-upload";
import { LoanTimeline } from "./loan-timeline";
import { justAppliedStore } from "./store";
import { useLoanQuery } from "./hooks/generated";
import { apiLoanToApplication } from "./loan-mapper";
import { useLoanDocumentsQuery, useUploadLoanDocumentMutation } from "./documents/hooks/generated";

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
  const { t, typeName, status, choice, docLabel, docHint } = useLoanText();
  const loan = useLoanQuery(reference);
  const application = loan.data ? apiLoanToApplication(loan.data) : undefined;
  const justApplied = justAppliedStore.useValue();
  const [files, setFiles] = useState<Partial<Record<DocumentId, StoredFile>>>({});
  const [extraOpen, setExtraOpen] = useState(false);
  const documents = useLoanDocumentsQuery(reference);
  const upload = useUploadLoanDocumentMutation();

  const back = justApplied === reference ? () => router.replace("/loans") : undefined;

  if (!application) {
    return (
      <>
        <AppBar leading="back" backFallback="/loans" title={t("stTitle")} />
        <Screen enter="slide">
          <EmptyState
            icon={<FileMagnifyingGlassIcon size={24} />}
            title={t("stNotFound")}
            description={t("stNotFoundText")}
            action={
              <ButtonLink href="/loans" size="sm">
                {t("stBack")}
              </ButtonLink>
            }
          />
        </Screen>
      </>
    );
  }

  const needed = application.requestedDocuments;
  const ready = needed.length > 0 && needed.every((id) => files[id]);
  const open = application.status === "submitted" || application.status === "in-review";
  const created = new Date(application.createdAt);

  return (
    <>
      <AppBar leading="back" backFallback="/loans" onBack={back} title={t("stTitle")} subtitle={application.reference} />
      <Screen enter="slide" className="flex flex-col gap-5 md:max-w-3xl">
        <DesktopTitle title={t("stTitle")} subtitle={application.reference} />

        <section aria-label={t("stStatusAria")} className="flex flex-col gap-4 rounded-card bg-ink p-4 text-white md:p-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0">{headIcon[application.status]}</span>
            <div>
              <p className="text-lg leading-6 font-extrabold" data-testid="status-headline">
                {status(application.status, "headline")}
              </p>
              <p className="mt-1 text-sm leading-6 text-white/75" data-testid="status-summary">
                {status(application.status, "summary")}
              </p>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3 rounded-control bg-white/10 p-3 text-sm">
            <div>
              <dt className="text-xs text-white/60">{t("stRef")}</dt>
              <dd data-testid="loan-ref" className="tabular font-bold">
                {application.reference}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-white/60">{t("stSubmitted")}</dt>
              <dd className="tabular font-bold">
                {formatDay(application.createdAt.slice(0, 10))}, {created.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-white/60">{t("stLoan")}</dt>
              <dd className="font-bold">{typeName(application.loanType)}</dd>
            </div>
            <div>
              <dt className="text-xs text-white/60">{t("stAmount")}</dt>
              <dd className="tabular font-bold">
                {formatMoney(application.amount)} · {t("stPerMonth", { amount: formatMoney(application.emi) })}
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
                  {t("stDocsRequested")}
                </h2>
                <p className="text-sm leading-6 text-ink/75">{t("stPleaseAdd", { docs: needed.map(docLabel).join(", ") })}</p>
              </div>
            </div>
            {needed.map((id) => {
              return (
                <DocumentUpload
                  key={id}
                  doc={id}
                  requested
                  label={docLabel(id)}
                  hint={docHint(id)}
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
                void Promise.all(needed.map((type) => {
                  const file = files[type]?.raw;
                  if (!file) return Promise.resolve();
                  const input = new FormData();
                  input.set("file", file);
                  input.set("type", type === "residence" ? "visa_or_residence_permit" : type === "employment" ? "employment_proof" : type === "income" ? "salary_or_income_proof" : type === "address" ? "address_proof" : type === "bank" ? "bank_statement" : "passport");
                  return upload.mutateAsync({ reference, input });
                })).then(() => {
                  setFiles({});
                  toast.success(t("stDocsSent"), { description: t("stDocsSentDesc") });
                }).catch((error) => toast.danger(error instanceof Error ? error.message : "Documents could not be uploaded."));
              }}
            >
              {t("stSendDocs")}
            </Button>
          </section>
        ) : null}

        <Card title={t("stTimeline")} id="progress">
          <LoanTimeline application={application} />
        </Card>

        <p className="flex items-start gap-2 rounded-control bg-surface-secondary px-4 py-3 text-xs leading-5 text-subtle">
          <InfoIcon size={16} className="mt-0.5 shrink-0" />
          {t("stNotify")}
        </p>

        <Card title={t("stApplication")} id="details">
          <dl className="flex flex-col gap-2 text-sm">
            <Row label={t("stTenure")} value={t("calcMonths", { count: application.tenure })} />
            <Row label={t("stPurpose")} value={choice("purpose", application.purpose)} />
            <Row label={t("stApplicant")} value={application.applicant.fullName} />
            <Row label={t("stCity")} value={application.applicant.city} />
            <Row label={t("stResidence")} value={choice("residence", application.applicant.residence)} />
            <Row label={t("stEmployment")} value={t("stEmploymentValue", { type: choice("emp", application.employment.type), employer: application.employment.employer })} />
            <Row label={t("stJobTitle")} value={t("stJobTitleValue", { title: application.employment.jobTitle, experience: choice("exp", application.employment.experience) })} />
            <Row label={t("stIncome")} value={formatMoney(application.employment.monthlyIncome)} />
          </dl>
        </Card>

        <Card title={t("stDocuments")} id="documents">
          <dl className="flex flex-col gap-2 text-sm">
            {documentTypes.map((doc) => (
              <Row key={doc.id} label={docLabel(doc.id)} value={documents.data?.find((item) => item.type === doc.id)?.originalFilename ?? application.documents[doc.id]?.name ?? (needed.includes(doc.id) ? t("stRequested") : t("stNotProvided"))} />
            ))}
          </dl>
        </Card>

        {open ? (
          <div className="flex flex-col gap-3">
            {extraOpen ? (
              <DocumentUpload
                label={t("upAdditional")}
                hint={t("upAdditionalHint")}
                file={undefined}
                onChange={(file) => {
                  if (!file) return;
                  setExtraOpen(false);
                  toast.info(`Document ready to upload: ${file.name}`);
                }}
              />
            ) : (
              <Button size="lg" fullWidth onPress={() => setExtraOpen(true)}>
                {t("stUploadExtra")}
              </Button>
            )}
          </div>
        ) : null}

        {application.status === "rejected" || application.status === "approved" ? (
          <ButtonLink href="/loans/apply" variant={application.status === "approved" ? "outline" : "primary"} size="lg" fullWidth>
            {application.status === "approved" ? t("stApplyAnother") : t("stApplyAgain")}
          </ButtonLink>
        ) : null}

        <ButtonLink href="/help" variant="outline" size="lg" fullWidth>
          {t("stContact")}
        </ButtonLink>
      </Screen>
    </>
  );
}
