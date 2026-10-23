"use client";

import { Button, Description, FieldError, Form, Input, Label, ListBox, Select, TextField } from "@heroui/react";
import { ArrowsClockwiseIcon, CalendarBlankIcon, CheckIcon, ImageIcon, InfoIcon, TrashIcon } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { AdminErrorState } from "@/components/admin/feedback";
import { FormCard } from "@/components/admin/forms/form-layout";
import { ImageUploader } from "@/components/admin/forms/image-uploader";
import { AdminPage, PageHeader } from "@/components/admin/layout";
import { AdminBreadcrumbs } from "@/components/admin/navigation";
import { cn } from "@/lib/cn";
import { BannerImage } from "./banner-image";
import { type Banner, type BannerPlacement, effectiveStatus, getBanner, NOW, placementMeta, placements } from "./banner-data";

type StatusChoice = "active" | "scheduled" | "inactive";

const schema = z.object({
  title: z.string().trim().min(2, "Enter at least 2 characters.").max(80, "Use at most 80 characters."),
  subtitle: z.string().trim().max(120, "Use at most 120 characters."),
  ctaLabel: z.string().trim().min(2, "CTA label is required.").max(24, "Use at most 24 characters."),
  ctaUrl: z.string().trim().regex(/^(\/[^\s]*|https:\/\/[^\s.]+\.[^\s]+)$/, "Use an internal path like /bikes or a full https:// URL."),
  placement: z.enum(placements),
  displayOrder: z.string().regex(/^[1-9][0-9]{0,2}$/, "Enter a whole number from 1."),
  startAt: z.string(),
  endAt: z.string(),
});
type Values = z.infer<typeof schema>;
type Errors = Partial<Record<keyof Values | "image" | "schedule", string>>;

const ict = (iso: string | null) => {
  if (!iso) return "";
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Phnom_Penh", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso)).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};
const toTime = (local: string) => Date.parse(`${local.length === 16 ? `${local}:00` : local}+07:00`);

const statusOptions: ReadonlyArray<{ value: StatusChoice; label: string; hint: string; dot: string }> = [
  { value: "active", label: "Active", hint: "Shows now, within its dates.", dot: "bg-[var(--admin-success)]" },
  { value: "scheduled", label: "Scheduled", hint: "Starts at a future date.", dot: "bg-[var(--admin-info)]" },
  { value: "inactive", label: "Inactive", hint: "Hidden, content is kept.", dot: "bg-[var(--admin-muted)]" },
];

function Field({ label, name, values, errors, change, required = false, description, extra, type = "text" }: { label: string; name: keyof Values; values: Values; errors: Errors; change: (name: keyof Values, value: string) => void; required?: boolean; description?: string; extra?: React.ReactNode; type?: string }) {
  return (
    <TextField name={name} isRequired={required} isInvalid={Boolean(errors[name])} value={values[name]} onChange={(value) => change(name, value)}>
      <div className="flex items-center justify-between gap-2"><Label>{label}</Label>{extra}</div>
      <Input type={type} />
      {description ? <Description>{description}</Description> : null}
      <FieldError>{errors[name]}</FieldError>
    </TextField>
  );
}

export function BannerForm({ banner }: { banner?: Banner }) {
  const router = useRouter();
  const params = useSearchParams();
  const queryPlacement = params.get("placement");
  const initialPlacement: BannerPlacement = banner?.placement ?? (placements.find((value) => value === queryPlacement) ?? "home_hero");
  const effective = banner ? effectiveStatus(banner) : "active";
  const [values, setValues] = useState<Values>(() => ({
    title: banner?.title ?? "", subtitle: banner?.subtitle ?? "", ctaLabel: banner?.ctaLabel ?? "", ctaUrl: banner?.ctaUrl ?? "", placement: initialPlacement,
    displayOrder: String(banner?.displayOrder ?? 1), startAt: ict(banner?.startAt ?? null), endAt: ict(banner?.endAt ?? null),
  }));
  const [choice, setChoice] = useState<StatusChoice>(effective === "scheduled" ? "scheduled" : effective === "inactive" ? "inactive" : "active");
  const [keepImage, setKeepImage] = useState(Boolean(banner));
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const change = (name: keyof Values, value: string) => { setValues((current) => ({ ...current, [name]: value })); setErrors((current) => ({ ...current, [name]: undefined, ...(name === "startAt" || name === "endAt" ? { schedule: undefined } : {}) })); };
  const link = values.ctaUrl.startsWith("https://") ? "External link" : values.ctaUrl.startsWith("/") ? "Internal link" : null;
  const cancel = () => router.push("/admin/banners");
  const preview = { title: values.title || "Banner title", subtitle: values.subtitle || "Banner subtitle", imageUrl: previewUrl ?? (keepImage ? banner?.imageUrl ?? null : null), tone: banner?.tone ?? "sun", art: banner?.art ?? "scooter" } as const;

  function onFiles(next: File[]) {
    setFiles(next);
    setErrors((current) => ({ ...current, image: undefined }));
    setPreviewUrl((current) => { if (current) URL.revokeObjectURL(current); return next[0] ? URL.createObjectURL(next[0]) : null; });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Errors = {};
    const parsed = schema.safeParse(values);
    if (!parsed.success) for (const [key, messages] of Object.entries(parsed.error.flatten().fieldErrors)) next[key as keyof Values] = messages?.[0];
    if (!keepImage && !files.length) next.image = "Add a banner image.";
    const start = values.startAt ? toTime(values.startAt) : null;
    const end = values.endAt ? toTime(values.endAt) : null;
    if (start !== null && end !== null && end <= start) next.schedule = "End must be after the start.";
    if (choice === "scheduled" && (start === null || start <= NOW)) next.schedule = "A scheduled banner needs a start date in the future.";
    if (Object.keys(next).length) { setErrors(next); return; }
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 250));
    router.push("/admin/banners");
  }

  const actions = (
    <>
      <Button className="min-h-11 flex-1 lg:flex-none" onPress={cancel} variant="tertiary">Cancel</Button>
      <Button className="min-h-11 flex-[2] lg:flex-none" type="submit" form="banner-form" variant="primary" isPending={saving}><CheckIcon />Save Banner</Button>
    </>
  );
  const shared = { values, errors, change };

  return (
    <AdminPage className="gap-5">
      <AdminBreadcrumbs items={[{ label: "Banners", href: "/admin/banners" }, { label: banner ? "Edit" : "Add New Banner" }]} />
      <PageHeader title={banner ? "Edit Banner" : "Add New Banner"} description={banner ? "Update the banner copy, image, placement and schedule." : "Create a promotional banner to engage your users."} actions={<div className="hidden gap-2 lg:flex">{actions}</div>} />
      <Form id="banner-form" aria-label={banner ? "Edit banner" : "Add banner"} validationBehavior="aria" validationErrors={errors as Record<string, string>} onSubmit={submit} className="block pb-24 lg:pb-0">
        <div className="flex flex-col gap-5 xl:grid xl:grid-cols-2 xl:items-start">
          <div className="contents xl:block xl:space-y-5">
          <FormCard className="order-1 xl:order-none" title="Banner Image" description="Recommended 1920 × 600 (16:5). JPG, PNG or WebP." icon={<ImageIcon size={19} weight="duotone" />}>
            {keepImage && !files.length ? (
              <div className="space-y-3">
                <BannerImage banner={preview} className="aspect-[16/5] w-full rounded-2xl border border-[var(--admin-border)]" sizes="720px" />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="min-h-11" onPress={() => setKeepImage(false)}><ArrowsClockwiseIcon size={16} />Replace image</Button>
                  <Button variant="ghost" className="min-h-11 text-[var(--admin-danger)]" onPress={() => setKeepImage(false)}><TrashIcon size={16} />Remove</Button>
                </div>
              </div>
            ) : (
              <ImageUploader limit={1} maxSizeMb={5} aspectClass="aspect-[16/5]" emptyTitle="Click to upload banner image" emptyHint="or drag and drop · PNG, JPG or WebP (1920 × 600 recommended)" onChange={onFiles} />
            )}
            {errors.image ? <p role="alert" className="mt-2 text-sm font-semibold text-[var(--admin-danger)]">{errors.image}</p> : null}
          </FormCard>
          <FormCard className="order-3 xl:order-none" title="Schedule" description="Cambodia Time — ICT / Asia/Phnom_Penh" icon={<CalendarBlankIcon size={19} weight="duotone" />}>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField name="startAt" isInvalid={Boolean(errors.schedule)} value={values.startAt} onChange={(value) => change("startAt", value)}><Label>Start date and time</Label><Input type="datetime-local" /><Description>Optional. Empty means it can show immediately.</Description></TextField>
              <TextField name="endAt" isInvalid={Boolean(errors.schedule)} value={values.endAt} onChange={(value) => change("endAt", value)}><Label>End date and time</Label><Input type="datetime-local" /><Description>Optional. Empty means no end.</Description></TextField>
            </div>
            {errors.schedule ? <p role="alert" className="mt-3 text-sm font-semibold text-[var(--admin-danger)]">{errors.schedule}</p> : null}
          </FormCard>
          </div>
          <div className="contents xl:block xl:space-y-5">
          <FormCard className="order-2 xl:order-none" title="Banner Information" icon={<InfoIcon size={19} weight="duotone" />}>
            <div className="space-y-4">
              <Field label="Title" name="title" required {...shared} />
              <Field label="Subtitle" name="subtitle" {...shared} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="CTA label" name="ctaLabel" required description="Button text, e.g. Book Now" {...shared} />
                <Field label="CTA URL" name="ctaUrl" required description="Internal path (/bikes) or https:// URL" extra={link ? <span className="rounded-full bg-[var(--admin-info-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--admin-info)]">{link}</span> : null} {...shared} />
              </div>
              <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,1fr)_9rem]">
                <Select name="placement" value={values.placement} onChange={(key) => key !== null && change("placement", String(key))}>
                  <Label>Placement</Label>
                  <Select.Trigger className="min-h-11"><Select.Value /><Select.Indicator /></Select.Trigger>
                  <Select.Popover className="adminOverlay"><ListBox>{placements.map((value) => <ListBox.Item key={value} id={value} textValue={placementMeta[value].label}>{placementMeta[value].label}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
                </Select>
                <Field label="Display order" name="displayOrder" type="number" required {...shared} />
              </div>
            </div>
          </FormCard>
          <FormCard className="order-4 xl:order-none" title="Status" description="Expired is computed from the end date, not chosen." icon={<CheckIcon size={19} weight="bold" />}>
            <div role="radiogroup" aria-label="Banner status" className="grid gap-2 sm:grid-cols-2">
              {statusOptions.map((option) => {
                const selected = choice === option.value;
                return (
                  <label key={option.value} className={cn("flex min-h-14 cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-[var(--admin-accent-strong)]", selected ? "border-[var(--admin-accent-strong)] bg-[var(--admin-accent-soft)]" : "border-[var(--admin-border)] bg-white hover:border-[var(--admin-border-strong)]")}>
                    <input type="radio" name="status" value={option.value} checked={selected} onChange={() => { setChoice(option.value); setErrors((current) => ({ ...current, schedule: undefined })); }} className="sr-only" />
                    <span className={cn("mt-1 size-2.5 shrink-0 rounded-full", option.dot)} aria-hidden />
                    <span><span className="block text-sm font-bold">{option.label}</span><span className="block text-xs text-[var(--admin-muted)]">{option.hint}</span></span>
                  </label>
                );
              })}
              <div aria-disabled="true" className="flex min-h-14 items-start gap-2.5 rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-3 opacity-70">
                <span className="mt-1 size-2.5 shrink-0 rounded-full bg-[var(--admin-danger)]" aria-hidden />
                <span><span className="block text-sm font-bold">Expired</span><span className="block text-xs text-[var(--admin-muted)]">Computed after the end date.</span></span>
              </div>
            </div>
            {effective === "expired" ? <p className="mt-3 text-xs text-[var(--admin-warning)]">This banner has expired. Extend the end date to show it again.</p> : null}
          </FormCard>
          </div>
        </div>
        <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-[var(--admin-border)] bg-white/95 p-3 backdrop-blur-md lg:hidden">{actions}</div>
      </Form>
    </AdminPage>
  );
}

export function BannerFormPage({ id }: { id?: string }) {
  const banner = id ? getBanner(id) : undefined;
  if (id && !banner) return <AdminPage><PageHeader title="Edit Banner" /><AdminErrorState title="Banner not found" description="This UI preview does not contain that banner." /></AdminPage>;
  return <BannerForm banner={banner} />;
}
