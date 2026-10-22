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
import { FlowFooter } from "@/features/booking-flow/flow-footer";
import { formatDay } from "@/features/bookings/dates";
import { profileStore } from "@/features/profile/store";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/cn";
import { formatMoney, formatPrice } from "@/lib/format";
import {
  type DocumentId,
  type LoanDraft,
  type LoanTypeId,
  calculateEmi,
  documentTypes,
  employmentTypes,
  experienceBands,
  getLoanType,
  labelOf,
  loanPurposes,
  loanTypes,
  MAX_EMI_SHARE,
  newLoanReference,
  residenceStatuses,
  tenuresFor,
  yesNo,
} from "./data";
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
} from "./schemas";
import { addApplication, justAppliedStore, loanDraftStore } from "./store";

const STEPS = ["Loan details", "Personal details", "Employment & income", "Documents", "Review & submit"] as const;
const LAST_STEP = STEPS.length;
const clampStep = (n: number) => Math.max(1, Math.min(LAST_STEP, Number.isFinite(n) ? n : 1));

type PatchProps = { draft: LoanDraft; patch: (partial: Partial<LoanDraft>) => void };

// ------------------------------------------------------------------ small form helpers

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

/** Single choice shown as chips (loan type, tenure, employment type). */
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
              if (!ids[0]) return; // a single choice: pressing the selected chip again keeps it
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

/** Saves every change to the draft, so a refresh or Back keeps what was typed. */
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

// ------------------------------------------------------------------ 1. loan details

function LoanStep({ draft, patch, formId, onValid }: PatchProps & { formId: string; onValid: () => void }) {
  const form = useForm({ resolver: zodResolver(loanDetailsSchema), mode: "onBlur", values: loanDetailsOf(draft) });
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
        label="Loan type"
        options={loanTypes.map((t) => ({ id: t.id, label: t.name.replace(" Loan", "") }))}
        onPick={(id) => {
          const next = getLoanType(id);
          if (!next) return;
          if (Number(form.getValues("tenure")) > next.maxTenure) form.setValue("tenure", String(tenuresFor(next).at(-1)));
          const amount = Number(form.getValues("amount"));
          if (amount > next.maxAmount || amount < next.minAmount) form.setValue("amount", String(Math.min(next.maxAmount, Math.max(next.minAmount, amount))));
        }}
      />

      <div className="flex flex-col gap-3">
        <Field control={form.control} name="amount" label="Required amount (USD)" inputMode="numeric" />
        <Slider
          aria-label="Required amount"
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

      <ChipField control={form.control} name="tenure" label="Preferred tenure (months)" options={tenuresFor(type).map((t) => ({ id: String(t), label: String(t) }))} />
      <SelectField control={form.control} name="purpose" label="Purpose of loan" options={loanPurposes} />

      <p className="rounded-control bg-surface-secondary px-4 py-3 text-sm" data-testid="emi-preview">
        Estimated <span className="tabular font-bold">{formatMoney(emi.monthly)}</span> a month at {type.apr}% a year. Final terms are confirmed after review.
      </p>
    </form>
  );
}

// ------------------------------------------------------------------ 2. personal

function PersonalStep({ draft, patch, formId, onValid }: PatchProps & { formId: string; onValid: () => void }) {
  const form = useForm({ resolver: zodResolver(personalSchema), mode: "onBlur", values: draft.applicant });
  useAutosave(form, (v) => patch({ applicant: { ...draft.applicant, ...v } }));

  return (
    <form id={formId} noValidate className="flex flex-col gap-4" onSubmit={form.handleSubmit(onValid)}>
      <Field control={form.control} name="fullName" label="Full name" autoComplete="name" description="As printed on your passport." />
      <Field control={form.control} name="mobile" label="Mobile number" type="tel" inputMode="tel" autoComplete="tel" placeholder="+971 50 123 4567" />
      <Field control={form.control} name="email" label="Email" type="email" inputMode="email" autoComplete="email" />
      <Field control={form.control} name="dob" label="Date of birth" type="date" autoComplete="bday" />
      <Field control={form.control} name="nationality" label="Nationality" autoComplete="country-name" />
      <Field control={form.control} name="city" label="Current city" autoComplete="address-level2" />
      <SelectField control={form.control} name="residence" label="Visa or residence status" options={residenceStatuses} />
    </form>
  );
}

// ------------------------------------------------------------------ 3. employment

function EmploymentStep({ draft, patch, formId, onValid }: PatchProps & { formId: string; onValid: () => void }) {
  const form = useForm({ resolver: zodResolver(employmentSchema), mode: "onBlur", values: draft.employment });
  useAutosave(form, (v) => patch({ employment: { ...draft.employment, ...v } }));

  const income = Number(draft.employment.monthlyIncome);
  const type = getLoanType(draft.loanType) ?? loanTypes[0];
  const emi = calculateEmi(draft.amount, type.apr, draft.tenure).monthly;
  const tooHigh = income > 0 && emi > income * MAX_EMI_SHARE;

  return (
    <form id={formId} noValidate className="flex flex-col gap-4" onSubmit={form.handleSubmit(onValid)}>
      <ChipField control={form.control} name="type" label="Employment type" options={employmentTypes} />
      <Field control={form.control} name="employer" label="Employer or business" autoComplete="organization" />
      <Field control={form.control} name="jobTitle" label="Job title" autoComplete="organization-title" />
      <Field control={form.control} name="monthlyIncome" label="Monthly income (USD)" inputMode="decimal" description="Before tax, from all regular sources." />
      <SelectField control={form.control} name="experience" label="Work experience" options={experienceBands} />
      <SelectField control={form.control} name="bankAccount" label="Do you have an active bank account?" options={yesNo} />
      {tooHigh ? (
        <p className="rounded-control bg-brand-soft px-4 py-3 text-sm" role="status">
          The monthly payment of {formatMoney(emi)} is above half of this income, so approval is less likely. You can still apply, or go back and lower the amount.
        </p>
      ) : null}
    </form>
  );
}

// ------------------------------------------------------------------ 4. documents

function DocumentsStep({ draft, patch }: PatchProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-subtle">PDF, JPG or PNG, up to 5 MB each. This preview only records the file name; nothing is uploaded.</p>
      {documentTypes.map((doc) => (
        <DocumentUpload
          key={doc.id}
          doc={doc.id}
          label={doc.label}
          hint="Upload or take a photo"
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

// ------------------------------------------------------------------ 5. review

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-subtle">{label}</dt>
      <dd className="text-right font-semibold break-words">{value}</dd>
    </div>
  );
}

function ReviewCard({ title, step, onEdit, children }: { title: string; step: number; onEdit: (step: number) => void; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="rounded-card border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold">{title}</h2>
        <button type="button" onClick={() => onEdit(step)} className="min-h-11 px-2 text-sm font-semibold text-[#b45309] underline underline-offset-2">
          Edit<span className="sr-only"> {title}</span>
        </button>
      </div>
      <dl className="flex flex-col gap-2 text-sm">{children}</dl>
    </section>
  );
}

function ReviewStep({ draft, agreed, onAgree, onEdit }: PatchProps & { agreed: boolean; onAgree: (v: boolean) => void; onEdit: (step: number) => void }) {
  const type = getLoanType(draft.loanType) ?? loanTypes[0];
  const emi = calculateEmi(draft.amount, type.apr, draft.tenure);
  const a = draft.applicant;
  const e = draft.employment;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-subtle">Please check your details before submitting.</p>
      <ReviewCard title="Loan details" step={1} onEdit={onEdit}>
        <ReviewRow label="Type" value={type.name} />
        <ReviewRow label="Amount" value={formatMoney(draft.amount)} />
        <ReviewRow label="Tenure" value={`${draft.tenure} months`} />
        <ReviewRow label="Purpose" value={labelOf(loanPurposes, draft.purpose)} />
        <ReviewRow label="Monthly payment" value={`${formatMoney(emi.monthly)} (${type.apr}% a year)`} />
      </ReviewCard>
      <ReviewCard title="Personal details" step={2} onEdit={onEdit}>
        <ReviewRow label="Name" value={a.fullName} />
        <ReviewRow label="Mobile" value={a.mobile} />
        <ReviewRow label="Email" value={a.email} />
        <ReviewRow label="Date of birth" value={formatDay(a.dob)} />
        <ReviewRow label="Nationality" value={a.nationality} />
        <ReviewRow label="City" value={a.city} />
        <ReviewRow label="Status" value={labelOf(residenceStatuses, a.residence)} />
      </ReviewCard>
      <ReviewCard title="Employment details" step={3} onEdit={onEdit}>
        <ReviewRow label="Type" value={labelOf(employmentTypes, e.type)} />
        <ReviewRow label="Employer" value={e.employer} />
        <ReviewRow label="Job title" value={e.jobTitle} />
        <ReviewRow label="Monthly income" value={formatMoney(Number(e.monthlyIncome))} />
        <ReviewRow label="Experience" value={labelOf(experienceBands, e.experience)} />
        <ReviewRow label="Active bank account" value={labelOf(yesNo, e.bankAccount)} />
      </ReviewCard>
      <ReviewCard title="Documents" step={4} onEdit={onEdit}>
        <ReviewRow label="Uploaded" value={`${documentTypes.filter((d) => draft.documents[d.id]).length} of ${documentTypes.length} documents`} />
        {documentTypes.map((doc) => (
          <ReviewRow key={doc.id} label={doc.label} value={draft.documents[doc.id]?.name ?? "Missing"} />
        ))}
      </ReviewCard>
      <Checkbox isSelected={agreed} onChange={onAgree}>
        I confirm that all the information provided is correct and complete
      </Checkbox>
      <p className="text-xs text-subtle">Simulated: no credit check is run and nothing is sent to a lender.</p>
    </div>
  );
}

// ------------------------------------------------------------------ flow

/** Numbered stepper (done steps are ticked) plus the current step's name. */
function Progress({ step }: { step: number }) {
  return (
    <div className="flex flex-col gap-3">
      <ol className="flex items-center" aria-label="Application progress">
        {STEPS.map((label, i) => (
          <li
            key={label}
            aria-current={i === step ? "step" : undefined}
            aria-label={`${label}${i < step ? ", done" : i === step ? ", current" : ""}`}
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
          Step {step + 1} of {STEPS.length}
        </p>
        <p className="text-xl leading-7 font-extrabold">{STEPS[step]}</p>
      </div>
    </div>
  );
}

/**
 * Five steps on one route, like the booking flow: the step is `?step=n`, every Continue pushes a history
 * entry so Back returns to the previous step, and the draft (session) keeps what was typed.
 */
export function ApplyFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const hydrated = useHydrated();
  const profile = profileStore.useValue();
  const stored = loanDraftStore.useValue();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submitted = useRef(false);

  const hasStored = stored !== null;
  const queryType = getLoanType(params.get("type") ?? "") ?? loanTypes[0];
  const draft: LoanDraft =
    stored ??
    {
      loanType: queryType.id,
      amount: Math.min(queryType.maxAmount, Math.max(queryType.minAmount, Number(params.get("amount")) || 5000)),
      tenure: Number(params.get("tenure")) || 24,
      purpose: "",
      applicant: { fullName: profile.name, mobile: profile.phone ? `+${profile.phone}` : "", email: profile.email, dob: "", nationality: "", city: "", residence: "" },
      employment: { type: "", employer: "", jobTitle: "", monthlyIncome: "", experience: "", bankAccount: "" },
      documents: {},
    };

  const patch = (partial: Partial<LoanDraft>) => loanDraftStore.set({ ...draft, ...partial });

  // Furthest step the data allows: you cannot URL-jump past steps you have not completed.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, step, requested]);

  function go(next: number) {
    if (!hasStored) loanDraftStore.set(draft); // the first Continue creates the stored draft
    router.push(withStep(next), { scroll: false });
  }

  function submit() {
    setSubmitting(true);
    window.setTimeout(() => {
      const type = getLoanType(draft.loanType) ?? loanTypes[0];
      const reference = newLoanReference();
      const now = new Date().toISOString();
      submitted.current = true;
      addApplication({
        reference,
        loanType: type.id,
        amount: draft.amount,
        tenure: draft.tenure,
        purpose: draft.purpose,
        emi: calculateEmi(draft.amount, type.apr, draft.tenure).monthly,
        status: "submitted",
        applicant: draft.applicant,
        employment: { ...draft.employment, monthlyIncome: Number(draft.employment.monthlyIncome) },
        documents: draft.documents as Partial<Record<DocumentId, { name: string; size: number }>>,
        requestedDocuments: [],
        history: [{ status: "submitted", at: now }],
        createdAt: now,
      });
      loanDraftStore.set(null);
      justAppliedStore.set(reference);
      router.replace(`/loans/${reference}`);
    }, 900);
  }

  const type = getLoanType(draft.loanType) ?? loanTypes[0];
  const emi = calculateEmi(draft.amount, type.apr, draft.tenure).monthly;

  const footerProps = { amount: emi, summaryLabel: "Monthly payment" } as const;
  const footer =
    step === 1 ? (
      <FlowFooter {...footerProps} label="Continue" formId="loan-form" />
    ) : step === 2 ? (
      <FlowFooter {...footerProps} label="Continue" formId="personal-form" />
    ) : step === 3 ? (
      <FlowFooter {...footerProps} label="Continue" formId="employment-form" />
    ) : step === 4 ? (
      <FlowFooter {...footerProps} label="Continue" onPress={() => go(5)} isDisabled={!documentsStepValid(draft)} />
    ) : (
      <FlowFooter {...footerProps} label="Submit application" onPress={submit} isPending={submitting} isDisabled={!agreed} />
    );

  return (
    <>
      <AppBar
        leading="back"
        backFallback="/loans"
        // Steps are history entries, so Back is a real pop; step 1 falls through to the default (back to the loans page).
        onBack={step > 1 ? () => router.back() : undefined}
        title="Expat loan"
        subtitle="Application"
      />

      <Screen enter="slide" bottom="footer" className="flex flex-col gap-5 lg:pb-12">
        <DesktopTitle title="Loan application" subtitle={type.name} />
        <Progress step={step - 1} />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
          <section aria-label={STEPS[step - 1]} className="min-w-0">
            <div key={step} className="rgo-page-in flex flex-col gap-5">
              {step === 1 ? <LoanStep formId="loan-form" draft={draft} patch={patch} onValid={() => go(2)} /> : null}
              {step === 2 ? <PersonalStep formId="personal-form" draft={draft} patch={patch} onValid={() => go(3)} /> : null}
              {step === 3 ? <EmploymentStep formId="employment-form" draft={draft} patch={patch} onValid={() => go(4)} /> : null}
              {step === 4 ? <DocumentsStep draft={draft} patch={patch} /> : null}
              {step === 5 ? <ReviewStep draft={draft} patch={patch} agreed={agreed} onAgree={setAgreed} onEdit={(s) => router.push(withStep(s), { scroll: false })} /> : null}
            </div>
            <div className="mt-6 hidden lg:block">{footer}</div>
          </section>

          <aside aria-label="Loan summary" className="hidden lg:block">
            <div className="sticky top-24 flex flex-col gap-3 rounded-card border border-line bg-surface p-4 text-sm">
              <p className="text-base font-bold">{type.name}</p>
              <ReviewRow label="Amount" value={formatMoney(draft.amount)} />
              <ReviewRow label="Tenure" value={`${draft.tenure} months`} />
              <ReviewRow label="Rate" value={`${type.apr}% a year`} />
              <div className="border-t border-line pt-3">
                <ReviewRow label="Monthly payment" value={formatMoney(emi)} />
              </div>
            </div>
          </aside>
        </div>
      </Screen>

      {/* Outside Screen: the slide-in transform would otherwise become this fixed bar's containing block. */}
      <div className="lg:hidden">{footer}</div>
    </>
  );
}
