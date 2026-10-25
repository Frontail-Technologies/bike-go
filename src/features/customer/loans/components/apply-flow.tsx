"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Slider } from "@heroui/react";
import { CheckIcon } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { type Control, Controller, type FieldValues, type Path, type UseFormReturn, useForm } from "react-hook-form";
import { AppBar } from "@/components/shared/app-bar";
import { DesktopTitle, Screen } from "@/components/shared/screen";
import { ChipGroup } from "@/components/ui/chip-group";
import { AppSelect, type SelectOption } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/selection-controls";
import { TextInput } from "@/components/ui/text-field";
import { FlowFooter } from "@/features/customer/bookings/components/flow/flow-footer";
import { toast } from "@/components/ui/toast";
import { formatDay } from "@/features/customer/bookings/lib/dates";
import { useCustomerProfileQuery } from "@/features/customer/profile/hooks/generated";
import { useCreateLoanMutation, useSubmitLoanMutation } from "../hooks/generated";
import { useUploadLoanDocumentMutation } from "../documents/hooks/generated";
import { loanDocumentType } from "../lib/document-types";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/cn";
import { useTranslations } from "@/i18n/hooks";
import { formatMoney, formatPrice } from "@/lib/format";
import {
  type LoanDraft,
  type LoanTypeId,
  calculateEmi,
  documentTypes,
  employmentTypes,
  experienceBands,
  getLoanType,
  loanPurposes,
  loanTypes,
  MAX_EMI_SHARE,
  residenceStatuses,
  tenuresFor,
} from "../lib/data";
import { useLoanText } from "../lib/use-loan-text";
import { DocumentUpload } from "./document-upload";
import {
  documentsStepValid,
  employmentSchema,
  employmentStepValid,
  loanDetailsOf,
  loanDetailsSchema,
  loanStepValid,
  personalSchema,
  personalStepValid,
} from "../schemas";
import { justAppliedStore, loanDraftStore } from "../stores/loan-draft-store";

const STEPS = ["applyStep1", "applyStep2", "applyStep3", "applyStep4", "applyStep5"] as const;
const LAST_STEP = STEPS.length;
const clampStep = (n: number) => Math.max(1, Math.min(LAST_STEP, Number.isFinite(n) ? n : 1));
const experienceMonths: Record<string, number> = { "under-1": 6, "1-3": 24, "3-5": 48, "5-plus": 72 };

const apiResidenceStatus = (value: string) => value.replaceAll("-", "_");
const apiEmploymentType = (value: string) => value.replaceAll("-", "_");

type PatchProps = { draft: LoanDraft; patch: (partial: Partial<LoanDraft>) => void };

function Field<T extends FieldValues>({
  control,
  name,
  label,
  ...rest
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  type?: string;
  inputMode?: "numeric" | "decimal" | "tel" | "email" | "text";
  autoComplete?: string;
  description?: string;
  placeholder?: string;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextInput
          label={label}
          value={String(field.value ?? "")}
          onChange={field.onChange}
          onBlur={field.onBlur}
          isInvalid={fieldState.invalid}
          error={fieldState.error?.message}
          {...rest}
        />
      )}
    />
  );
}

function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  options,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: SelectOption[];
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className="flex flex-col gap-1">
          <AppSelect
            label={label}
            options={options}
            value={field.value ? String(field.value) : null}
            onChange={(key) => key && field.onChange(String(key))}
            isInvalid={fieldState.invalid}
          />
          {fieldState.error ? (
            <p className="text-xs text-danger" role="alert">
              {fieldState.error.message}
            </p>
          ) : null}
        </div>
      )}
    />
  );
}

function ChipField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  onPick,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: SelectOption[];
  onPick?: (id: string) => void;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">{label}</p>
          <ChipGroup
            label={label}
            options={options}
            value={field.value ? [String(field.value)] : []}
            onChange={(ids) => {
              if (!ids[0]) return;
              field.onChange(ids[0]);
              onPick?.(ids[0]);
            }}
          />
          {fieldState.error ? (
            <p className="text-xs text-danger" role="alert">
              {fieldState.error.message}
            </p>
          ) : null}
        </div>
      )}
    />
  );
}

function useAutosave<T extends FieldValues>(form: UseFormReturn<T>, save: (values: T) => void) {
  const latest = useRef(save);
  useEffect(() => {
    latest.current = save;
  });
  useEffect(() => {
    const sub = form.watch((values) => latest.current(values as T));
    return () => sub.unsubscribe();
  }, [form]);
}

function LoanStep({ draft, patch, formId, onValid }: PatchProps & { formId: string; onValid: () => void }) {
  const { t, typeShort, options } = useLoanText();
  const intl = useTranslations("loans");
  const form = useForm({ resolver: zodResolver(loanDetailsSchema(t)), mode: "onBlur", values: loanDetailsOf(draft) });
  useAutosave(form, (v) => {
    const type = getLoanType(v.loanType ?? "");
    patch({
      loanType: (type?.id ?? draft.loanType) as LoanTypeId,
      amount: Number(v.amount) || 0,
      tenure: Number(v.tenure) || draft.tenure,
      purpose: v.purpose ?? "",
    });
  });

  const type = getLoanType(draft.loanType) ?? loanTypes[0];
  const emi = calculateEmi(draft.amount, type.apr, draft.tenure);
  const sliderValue = Math.min(type.maxAmount, Math.max(type.minAmount, draft.amount || type.minAmount));

  return (
    <form id={formId} noValidate className="flex flex-col gap-5" onSubmit={form.handleSubmit(onValid)}>
      <ChipField
        control={form.control}
        name="loanType"
        label={t("applyLoanType")}
        options={loanTypes.map((lt) => ({ id: lt.id, label: typeShort(lt.id) }))}
        onPick={(id) => {
          const next = getLoanType(id);
          if (!next) return;
          if (Number(form.getValues("tenure")) > next.maxTenure) form.setValue("tenure", String(tenuresFor(next).at(-1)));
          const amount = Number(form.getValues("amount"));
          if (amount > next.maxAmount || amount < next.minAmount) form.setValue("amount", String(Math.min(next.maxAmount, Math.max(next.minAmount, amount))));
        }}
      />

      <div className="flex flex-col gap-3">
        <Field control={form.control} name="amount" label={t("applyAmount")} inputMode="numeric" />
        <Slider
          aria-label={t("applyAmountAria")}
          className="w-full"
          minValue={type.minAmount}
          maxValue={type.maxAmount}
          step={500}
          value={sliderValue}
          onChange={(v) => form.setValue("amount", String(Array.isArray(v) ? v[0] : v), { shouldValidate: true })}
        >
          <Slider.Track>
            {({ state }) => (
              <>
                <Slider.Fill />
                {state.values.map((_, i) => (
                  <Slider.Thumb key={i} index={i} />
                ))}
              </>
            )}
          </Slider.Track>
          <div className="mt-1 flex justify-between text-xs text-subtle">
            <span className="tabular">{formatPrice(type.minAmount)}</span>
            <span className="tabular">{formatPrice(type.maxAmount)}</span>
          </div>
        </Slider>
      </div>

      <ChipField control={form.control} name="tenure" label={t("applyTenure")} options={tenuresFor(type).map((m) => ({ id: String(m), label: String(m) }))} />
      <SelectField control={form.control} name="purpose" label={t("applyPurpose")} options={options("purpose", loanPurposes)} />

      <p className="rounded-control bg-surface-secondary px-4 py-3 text-sm" data-testid="emi-preview">
        {intl.rich("applyEmiPreview", { amount: formatMoney(emi.monthly), rate: type.apr, b: (chunks) => <span className="tabular font-bold">{chunks}</span> })}
      </p>
    </form>
  );
}

function PersonalStep({ draft, patch, formId, onValid }: PatchProps & { formId: string; onValid: () => void }) {
  const { t, options } = useLoanText();
  const form = useForm({ resolver: zodResolver(personalSchema(t)), mode: "onBlur", values: draft.applicant });
  useAutosave(form, (v) => patch({ applicant: { ...draft.applicant, ...v } }));

  return (
    <form id={formId} noValidate className="flex flex-col gap-4" onSubmit={form.handleSubmit(onValid)}>
      <Field control={form.control} name="fullName" label={t("applyFullName")} autoComplete="name" description={t("applyFullNameHint")} />
      <Field control={form.control} name="mobile" label={t("applyMobile")} type="tel" inputMode="tel" autoComplete="tel" placeholder={t("applyMobilePlaceholder")} />
      <Field control={form.control} name="email" label={t("applyEmail")} type="email" inputMode="email" autoComplete="email" />
      <Field control={form.control} name="dob" label={t("applyDob")} type="date" autoComplete="bday" />
      <Field control={form.control} name="nationality" label={t("applyNationality")} autoComplete="country-name" />
      <Field control={form.control} name="city" label={t("applyCity")} autoComplete="address-level2" />
      <SelectField control={form.control} name="residence" label={t("applyResidence")} options={options("residence", residenceStatuses)} />
    </form>
  );
}

function EmploymentStep({ draft, patch, formId, onValid }: PatchProps & { formId: string; onValid: () => void }) {
  const { t, options, yesNo } = useLoanText();
  const form = useForm({ resolver: zodResolver(employmentSchema(t)), mode: "onBlur", values: draft.employment });
  useAutosave(form, (v) => patch({ employment: { ...draft.employment, ...v } }));

  const income = Number(draft.employment.monthlyIncome);
  const type = getLoanType(draft.loanType) ?? loanTypes[0];
  const emi = calculateEmi(draft.amount, type.apr, draft.tenure).monthly;
  const tooHigh = income > 0 && emi > income * MAX_EMI_SHARE;

  return (
    <form id={formId} noValidate className="flex flex-col gap-4" onSubmit={form.handleSubmit(onValid)}>
      <ChipField control={form.control} name="type" label={t("applyEmpType")} options={options("emp", employmentTypes)} />
      <Field control={form.control} name="employer" label={t("applyEmployer")} autoComplete="organization" />
      <Field control={form.control} name="jobTitle" label={t("applyJobTitle")} autoComplete="organization-title" />
      <Field control={form.control} name="monthlyIncome" label={t("applyIncome")} inputMode="decimal" description={t("applyIncomeHint")} />
      <SelectField control={form.control} name="experience" label={t("applyExperience")} options={options("exp", experienceBands)} />
      <SelectField control={form.control} name="bankAccount" label={t("applyBank")} options={yesNo} />
      {tooHigh ? (
        <p className="rounded-control bg-brand-soft px-4 py-3 text-sm" role="status">
          {t("applyTooHigh", { emi: formatMoney(emi) })}
        </p>
      ) : null}
    </form>
  );
}

function DocumentsStep({ draft, patch }: PatchProps) {
  const { t, docLabel } = useLoanText();

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-subtle">{t("applyDocsIntro")}</p>
      {documentTypes.map((doc) => (
        <DocumentUpload
          key={doc.id}
          doc={doc.id}
          label={docLabel(doc.id)}
          hint={t("applyUploadHint")}
          file={draft.documents[doc.id]}
          onChange={(file) => {
            const documents = { ...draft.documents };
            if (file) documents[doc.id] = file;
            else delete documents[doc.id];
            patch({ documents });
          }}
        />
      ))}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-subtle">{label}</dt>
      <dd className="text-right font-semibold break-words">{value}</dd>
    </div>
  );
}

function ReviewCard({ title, step, onEdit, children }: { title: string; step: number; onEdit: (step: number) => void; children: React.ReactNode }) {
  const intl = useTranslations("loans");

  return (
    <section aria-label={title} className="rounded-card border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold">{title}</h2>
        <button type="button" onClick={() => onEdit(step)} className="min-h-11 px-2 text-sm font-semibold text-[#b45309] underline underline-offset-2">
          {intl("rEdit")}<span className="sr-only"> {title}</span>
        </button>
      </div>
      <dl className="flex flex-col gap-2 text-sm">{children}</dl>
    </section>
  );
}

function ReviewStep({ draft, agreed, onAgree, onEdit }: PatchProps & { agreed: boolean; onAgree: (v: boolean) => void; onEdit: (step: number) => void }) {
  const { t, typeName, choice, yesNoLabel, docLabel } = useLoanText();
  const type = getLoanType(draft.loanType) ?? loanTypes[0];
  const emi = calculateEmi(draft.amount, type.apr, draft.tenure);
  const a = draft.applicant;
  const e = draft.employment;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-subtle">{t("applyReviewIntro")}</p>
      <ReviewCard title={t("reviewLoan")} step={1} onEdit={onEdit}>
        <ReviewRow label={t("rType")} value={typeName(type.id)} />
        <ReviewRow label={t("rAmount")} value={formatMoney(draft.amount)} />
        <ReviewRow label={t("rTenure")} value={t("calcMonths", { count: draft.tenure })} />
        <ReviewRow label={t("rPurpose")} value={choice("purpose", draft.purpose)} />
        <ReviewRow label={t("rMonthly")} value={t("rMonthlyValue", { amount: formatMoney(emi.monthly), rate: type.apr })} />
      </ReviewCard>
      <ReviewCard title={t("reviewPersonal")} step={2} onEdit={onEdit}>
        <ReviewRow label={t("rName")} value={a.fullName} />
        <ReviewRow label={t("rMobile")} value={a.mobile} />
        <ReviewRow label={t("rEmail")} value={a.email} />
        <ReviewRow label={t("rDob")} value={formatDay(a.dob)} />
        <ReviewRow label={t("rNationality")} value={a.nationality} />
        <ReviewRow label={t("rCity")} value={a.city} />
        <ReviewRow label={t("rStatus")} value={choice("residence", a.residence)} />
      </ReviewCard>
      <ReviewCard title={t("reviewEmployment")} step={3} onEdit={onEdit}>
        <ReviewRow label={t("rType")} value={choice("emp", e.type)} />
        <ReviewRow label={t("rEmployer")} value={e.employer} />
        <ReviewRow label={t("rJobTitle")} value={e.jobTitle} />
        <ReviewRow label={t("rIncome")} value={formatMoney(Number(e.monthlyIncome))} />
        <ReviewRow label={t("rExperience")} value={choice("exp", e.experience)} />
        <ReviewRow label={t("rBank")} value={yesNoLabel(e.bankAccount)} />
      </ReviewCard>
      <ReviewCard title={t("reviewDocs")} step={4} onEdit={onEdit}>
        <ReviewRow label={t("rUploaded")} value={t("rUploadedValue", { done: documentTypes.filter((d) => draft.documents[d.id]).length, total: documentTypes.length })} />
        {documentTypes.map((doc) => (
          <ReviewRow key={doc.id} label={docLabel(doc.id)} value={draft.documents[doc.id]?.name ?? t("rMissing")} />
        ))}
      </ReviewCard>
      <Checkbox isSelected={agreed} onChange={onAgree}>
        {t("applyConfirm")}
      </Checkbox>
      <p className="text-xs text-subtle">{t("applySimulated")}</p>
    </div>
  );
}

function Progress({ step }: { step: number }) {
  const intl = useTranslations("loans");

  return (
    <div className="flex flex-col gap-3">
      <ol className="flex items-center" aria-label={intl("applyProgressAria")}>
        {STEPS.map((label, i) => (
          <li
            key={label}
            aria-current={i === step ? "step" : undefined}
            aria-label={i < step ? intl("applyStepDone", { label: intl(label) }) : i === step ? intl("applyStepCurrent", { label: intl(label) }) : intl(label)}
            className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors duration-200 motion-reduce:transition-none",
                i === step ? "bg-brand text-ink" : i < step ? "bg-brand-soft text-ink" : "border border-line bg-surface text-subtle",
              )}
            >
              {i < step ? <CheckIcon size={16} weight="bold" /> : i + 1}
            </span>
            {i < STEPS.length - 1 ? <span className={cn("mx-1 h-0.5 flex-1 rounded-full", i < step ? "bg-brand" : "bg-line")} /> : null}
          </li>
        ))}
      </ol>
      <div>
        <p className="text-sm text-subtle" aria-live="polite">
          {intl("applyStepOf", { step: step + 1, total: STEPS.length })}
        </p>
        <p className="text-xl leading-7 font-extrabold">{intl(STEPS[step]!)}</p>
      </div>
    </div>
  );
}

export function ApplyFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const hydrated = useHydrated();
  const { t, typeName } = useLoanText();
  const intl = useTranslations("loans");
  const profile = useCustomerProfileQuery();
  const createLoan = useCreateLoanMutation();
  const submitLoan = useSubmitLoanMutation();
  const uploadDocument = useUploadLoanDocumentMutation();
  const stored = loanDraftStore.useValue();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const submitted = useRef(false);
  const remoteDraftReference = useRef<string | null>(null);

  const hasStored = stored !== null;
  const queryType = getLoanType(params.get("type") ?? "") ?? loanTypes[0];
  const draft: LoanDraft =
    stored ??
    {
      loanType: queryType.id,
      amount: Math.min(queryType.maxAmount, Math.max(queryType.minAmount, Number(params.get("amount")) || 5000)),
      tenure: Number(params.get("tenure")) || 24,
      purpose: "",
      applicant: { fullName: profile.data?.fullName ?? "", mobile: profile.data?.phone ?? "", email: profile.data?.email ?? "", dob: "", nationality: "", city: "", residence: "" },
      employment: { type: "", employer: "", jobTitle: "", monthlyIncome: "", experience: "", bankAccount: "" },
      documents: {},
    };

  const patch = (partial: Partial<LoanDraft>) => loanDraftStore.set({ ...draft, ...partial });

  const maxStep = !hasStored || !loanStepValid(draft) ? 1 : !personalStepValid(draft) ? 2 : !employmentStepValid(draft) ? 3 : !documentsStepValid(draft) ? 4 : LAST_STEP;
  const requested = clampStep(Number(params.get("step") ?? 1));
  const step = Math.min(requested, hasStored ? maxStep : 1);

  const withStep = (n: number) => {
    const qs = new URLSearchParams(params.toString());
    qs.set("step", String(n));
    return `?${qs}`;
  };

  useEffect(() => {
    if (!hydrated || submitted.current || step === requested) return;
    router.replace(withStep(step), { scroll: false });
  }, [hydrated, step, requested]);

  function go(next: number) {
    if (!hasStored) loanDraftStore.set(draft);
    router.push(withStep(next), { scroll: false });
  }

  async function submit() {
    setSubmitting(true);
    setSubmissionError(null);
    try {
      const reference = remoteDraftReference.current ?? (await createLoan.mutateAsync({ input: {
        loanType: draft.loanType,
        currency: "USD",
        requestedAmountMinor: Math.round(draft.amount * 100),
        tenureMonths: draft.tenure,
        purpose: draft.purpose || undefined,
        fullName: draft.applicant.fullName || undefined,
        mobile: draft.applicant.mobile || undefined,
        email: draft.applicant.email || undefined,
        dateOfBirth: draft.applicant.dob || undefined,
        nationality: draft.applicant.nationality || undefined,
        currentCity: draft.applicant.city || undefined,
        residenceStatus: apiResidenceStatus(draft.applicant.residence),
        employmentType: apiEmploymentType(draft.employment.type),
        employerName: draft.employment.employer || undefined,
        jobTitle: draft.employment.jobTitle || undefined,
        monthlyIncomeMinor: draft.employment.monthlyIncome ? Math.round(Number(draft.employment.monthlyIncome) * 100) : undefined,
        workExperienceMonths: experienceMonths[draft.employment.experience] ?? 0,
        hasActiveBankAccount: draft.employment.bankAccount === "yes",
      } })).reference;
      remoteDraftReference.current = reference;
      await Promise.all(documentTypes.map(async ({ id }) => {
        const file = draft.documents[id]?.raw;
        if (!(file instanceof File)) throw new Error("Please select each required document again before submitting.");
        const input = new FormData();
        input.set("file", file);
        input.set("type", loanDocumentType(id));
        await uploadDocument.mutateAsync({ reference, input });
      }));
      await submitLoan.mutateAsync({ reference, idempotencyKey: crypto.randomUUID() });
      submitted.current = true;
      loanDraftStore.set(null);
      justAppliedStore.set(reference);
      router.replace(`/loans/${reference}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Your application could not be submitted. Please try again.";
      setSubmissionError(message);
      toast.danger(message);
    } finally {
      setSubmitting(false);
    }
  }

  const type = getLoanType(draft.loanType) ?? loanTypes[0];
  const emi = calculateEmi(draft.amount, type.apr, draft.tenure).monthly;

  const footerProps = { amount: emi, summaryLabel: t("rMonthly") } as const;
  const footer =
    step === 1 ? (
      <FlowFooter {...footerProps} label={t("continue")} formId="loan-form" />
    ) : step === 2 ? (
      <FlowFooter {...footerProps} label={t("continue")} formId="personal-form" />
    ) : step === 3 ? (
      <FlowFooter {...footerProps} label={t("continue")} formId="employment-form" />
    ) : step === 4 ? (
      <FlowFooter {...footerProps} label={t("continue")} onPress={() => go(5)} isDisabled={!documentsStepValid(draft)} />
    ) : (
      <FlowFooter {...footerProps} label={t("applySubmit")} onPress={() => void submit()} isPending={submitting} isDisabled={!agreed} />
    );

  return (
    <>
      <AppBar
        leading="back"
        backFallback="/loans"
        onBack={step > 1 ? () => router.back() : undefined}
        title={t("applyAppBarTitle")}
        subtitle={t("applyAppBarSub")}
      />

      <Screen enter="slide" bottom="footer" className="flex flex-col gap-5 lg:pb-12">
        <DesktopTitle title={t("applyDesktopTitle")} subtitle={typeName(type.id)} />
        <Progress step={step - 1} />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
          <section aria-label={intl(STEPS[step - 1]!)} className="min-w-0">
            <div key={step} className="rgo-page-in flex flex-col gap-5">
              {step === 1 ? <LoanStep formId="loan-form" draft={draft} patch={patch} onValid={() => go(2)} /> : null}
              {step === 2 ? <PersonalStep formId="personal-form" draft={draft} patch={patch} onValid={() => go(3)} /> : null}
              {step === 3 ? <EmploymentStep formId="employment-form" draft={draft} patch={patch} onValid={() => go(4)} /> : null}
              {step === 4 ? <DocumentsStep draft={draft} patch={patch} /> : null}
              {step === 5 ? <ReviewStep draft={draft} patch={patch} agreed={agreed} onAgree={setAgreed} onEdit={(s) => router.push(withStep(s), { scroll: false })} /> : null}
              {submissionError ? <p className="rounded-control bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">{submissionError}</p> : null}
            </div>
            <div className="mt-6 hidden lg:block">{footer}</div>
          </section>

          <aside aria-label={t("applySummaryAria")} className="hidden lg:block">
            <div className="sticky top-24 flex flex-col gap-3 rounded-card border border-line bg-surface p-4 text-sm">
              <p className="text-base font-bold">{typeName(type.id)}</p>
              <ReviewRow label={t("rAmount")} value={formatMoney(draft.amount)} />
              <ReviewRow label={t("rTenure")} value={t("calcMonths", { count: draft.tenure })} />
              <ReviewRow label={t("rRate")} value={t("rRateValue", { rate: type.apr })} />
              <div className="border-t border-line pt-3">
                <ReviewRow label={t("rMonthly")} value={formatMoney(emi)} />
              </div>
            </div>
          </aside>
        </div>
      </Screen>

      <div className="lg:hidden">{footer}</div>
    </>
  );
}
