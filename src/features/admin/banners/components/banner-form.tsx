"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Description, FieldError, Form, Input, Label, ListBox, Select, TextField } from "@heroui/react";
import { ArrowsClockwiseIcon, CalendarBlankIcon, CheckIcon, ImageIcon, InfoIcon, TrashIcon } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm, type Control, type FieldPath } from "react-hook-form";
import { AdminErrorState, AdminLoadingState } from "@/components/admin/feedback";
import { FormCard } from "@/components/admin/forms/form-layout";
import { ImageUploader } from "@/components/admin/forms/image-uploader";
import { AdminPage, PageHeader } from "@/components/admin/layout";
import { AdminBreadcrumbs } from "@/components/admin/navigation";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/error";
import { cn } from "@/lib/cn";
import { useBannerMutations, useBannerQuery } from "../hooks/use-banners";
import { blankBannerForm, bannerToFormValues, formValuesToFields, placementMeta } from "../lib/banner-model";
import { bannerFormSchema, type BannerFormValues } from "../schemas/banner-schemas";
import { placements, type Banner } from "../types/banner";
import { BannerImage } from "./banner-image";

type StatusChoice = BannerFormValues["status"];
const statusOptions: ReadonlyArray<{ value: StatusChoice; label: string; hint: string; dot: string }> = [
  { value: "active", label: "Active", hint: "Shows now, within its dates.", dot: "bg-[var(--admin-success)]" },
  { value: "scheduled", label: "Scheduled", hint: "Starts at a future date.", dot: "bg-[var(--admin-info)]" },
  { value: "inactive", label: "Inactive", hint: "Hidden, content is kept.", dot: "bg-[var(--admin-muted)]" },
];

function TextInput({ control, name, label, required = false, description, extra, type = "text" }: { control: Control<BannerFormValues>; name: FieldPath<BannerFormValues>; label: string; required?: boolean; description?: string; extra?: React.ReactNode; type?: string }) {
  return (
    <Controller control={control} name={name} render={({ field, fieldState }) => (
      <TextField name={name} isRequired={required} isInvalid={Boolean(fieldState.error)} value={String(field.value)} onChange={field.onChange}>
        <div className="flex items-center justify-between gap-2"><Label>{label}</Label>{extra}</div>
        <Input type={type} />
        {description ? <Description>{description}</Description> : null}
        <FieldError>{fieldState.error?.message}</FieldError>
      </TextField>
    )} />
  );
}

export function BannerForm({ banner }: { banner?: Banner }) {
  const router = useRouter();
  const params = useSearchParams();
  const mutations = useBannerMutations();
  const queryPlacement = params.get("placement");
  const initialPlacement = banner?.placement ?? placements.find((value) => value === queryPlacement) ?? "home_hero";
  const form = useForm<BannerFormValues>({ resolver: zodResolver(bannerFormSchema), defaultValues: banner ? bannerToFormValues(banner) : blankBannerForm(initialPlacement) });
  const [keepImage, setKeepImage] = useState(Boolean(banner));
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const values = form.watch();
  const saving = form.formState.isSubmitting;

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const link = values.ctaUrl.startsWith("http") ? "External link" : values.ctaUrl.startsWith("/") ? "Internal link" : null;
  const cancel = () => router.push("/admin/banners");
  const stored = banner?.effectiveStatus === "expired";

  function onFiles(next: File[]) {
    setFiles(next);
    setImageError("");
    setPreviewUrl(next[0] ? URL.createObjectURL(next[0]) : null);
  }

  const submit = form.handleSubmit(async (formValues) => {
    setSubmitError("");
    if (!keepImage && !files.length) { setImageError("Add a banner image."); return; }
    const fields = formValuesToFields(formValues);
    const image = files[0];
    try {
      const saved = banner ? await mutations.update.mutateAsync({ id: banner.id, ...fields, ...(image ? { image } : {}) }) : await mutations.create.mutateAsync({ ...fields, image: image as File });
      toast.success(banner ? `${saved.title} updated` : `${saved.title} created`);
      router.push("/admin/banners");
    } catch (error) {
      if (error instanceof ApiError) {
        let matched = false;
        for (const item of error.fieldErrors) {
          if (item.path === "image") { setImageError(item.message); matched = true; } else if (item.path && item.path in blankBannerForm("home_hero")) { form.setError(item.path as FieldPath<BannerFormValues>, { message: item.message }); matched = true; }
        }
        setSubmitError(matched ? "Check the highlighted fields." : error.message);
      } else setSubmitError("Something went wrong. Try again.");
    }
  });

  const actions = (
    <>
      <Button className="min-h-11 flex-1 lg:flex-none" onPress={cancel} variant="tertiary">Cancel</Button>
      <Button className="min-h-11 flex-[2] lg:flex-none" type="submit" form="banner-form" variant="primary" isPending={saving}><CheckIcon />Save Banner</Button>
    </>
  );

  return (
    <AdminPage className="gap-5">
      <AdminBreadcrumbs items={[{ label: "Banners", href: "/admin/banners" }, { label: banner ? "Edit" : "Add New Banner" }]} />
      <PageHeader title={banner ? "Edit Banner" : "Add New Banner"} description={banner ? "Update the banner copy, image, placement and schedule." : "Create a promotional banner to engage your users."} actions={<div className="hidden gap-2 lg:flex">{actions}</div>} />
      <Form id="banner-form" aria-label={banner ? "Edit banner" : "Add banner"} onSubmit={submit} className="block pb-24 lg:pb-0">
        {submitError ? <Alert status="danger" className="mb-5"><Alert.Indicator /><Alert.Content><Alert.Title>Banner was not saved</Alert.Title><Alert.Description>{submitError}</Alert.Description></Alert.Content></Alert> : null}
        <div className="flex flex-col gap-5 xl:grid xl:grid-cols-2 xl:items-start">
          <div className="contents xl:block xl:space-y-5">
            <FormCard className="order-1 xl:order-none" title="Banner Image" description="Recommended 1920 × 600 (16:5). JPG, PNG or WebP, up to 5 MB." icon={<ImageIcon size={19} weight="duotone" />}>
              {keepImage && !files.length && banner ? (
                <div className="space-y-3">
                  <BannerImage banner={banner} className="aspect-[16/5] w-full rounded-2xl border border-[var(--admin-border)]" sizes="720px" />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="min-h-11" onPress={() => setKeepImage(false)}><ArrowsClockwiseIcon size={16} />Replace image</Button>
                    <Button variant="ghost" className="min-h-11 text-[var(--admin-danger)]" onPress={() => setKeepImage(false)}><TrashIcon size={16} />Remove</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <ImageUploader limit={1} maxSizeMb={5} aspectClass="aspect-[16/5]" emptyTitle="Click to upload banner image" emptyHint="or drag and drop · PNG, JPG or WebP (1920 × 600 recommended)" onChange={onFiles} />
                  {banner && !files.length ? <Button variant="ghost" className="min-h-11" onPress={() => setKeepImage(true)}>Keep the current image</Button> : null}
                </div>
              )}
              {imageError ? <p role="alert" className="mt-2 text-sm font-semibold text-[var(--admin-danger)]">{imageError}</p> : null}
            </FormCard>
            <FormCard className="order-3 xl:order-none" title="Schedule" description="Cambodia Time — ICT / Asia/Phnom_Penh" icon={<CalendarBlankIcon size={19} weight="duotone" />}>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput control={form.control} name="startAt" label="Start date and time" type="datetime-local" description="Optional. Empty means it can show immediately." />
                <TextInput control={form.control} name="endAt" label="End date and time" type="datetime-local" description="Optional. Empty means no end." />
              </div>
            </FormCard>
          </div>
          <div className="contents xl:block xl:space-y-5">
            <FormCard className="order-2 xl:order-none" title="Banner Information" icon={<InfoIcon size={19} weight="duotone" />}>
              <div className="space-y-4">
                <TextInput control={form.control} name="title" label="Title" required />
                <TextInput control={form.control} name="subtitle" label="Subtitle" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextInput control={form.control} name="ctaLabel" label="CTA label" required description="Button text, e.g. Book Now" />
                  <TextInput control={form.control} name="ctaUrl" label="CTA URL" required description="Internal path (/bikes) or https:// URL" extra={link ? <span className="rounded-full bg-[var(--admin-info-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--admin-info)]">{link}</span> : null} />
                </div>
                <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,1fr)_9rem]">
                  <Controller control={form.control} name="placement" render={({ field }) => (
                    <Select name="placement" value={field.value} onChange={(key) => key !== null && field.onChange(String(key))}>
                      <Label>Placement</Label>
                      <Select.Trigger className="min-h-11"><Select.Value /><Select.Indicator /></Select.Trigger>
                      <Select.Popover className="adminOverlay"><ListBox>{placements.map((value) => <ListBox.Item key={value} id={value} textValue={placementMeta[value].label}>{placementMeta[value].label}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
                    </Select>
                  )} />
                  <TextInput control={form.control} name="displayOrder" label="Display order" type="number" required />
                </div>
              </div>
            </FormCard>
            <FormCard className="order-4 xl:order-none" title="Status" description="Expired is computed from the end date, not chosen." icon={<CheckIcon size={19} weight="bold" />}>
              <Controller control={form.control} name="status" render={({ field }) => (
                <div role="radiogroup" aria-label="Banner status" className="grid gap-2 sm:grid-cols-2">
                  {statusOptions.map((option) => {
                    const selected = field.value === option.value;
                    return (
                      <label key={option.value} className={cn("flex min-h-14 cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-[var(--admin-accent-strong)]", selected ? "border-[var(--admin-accent-strong)] bg-[var(--admin-accent-soft)]" : "border-[var(--admin-border)] bg-white hover:border-[var(--admin-border-strong)]")}>
                        <input type="radio" name="status" value={option.value} checked={selected} onChange={() => field.onChange(option.value)} className="sr-only" />
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
              )} />
              {stored ? <p className="mt-3 text-xs text-[var(--admin-warning)]">This banner has expired. Extend the end date to show it again.</p> : null}
              {values.status === "scheduled" ? <p className="mt-3 text-xs text-[var(--admin-muted)]">The backend shows it automatically once the start date passes.</p> : null}
            </FormCard>
          </div>
        </div>
        <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-[var(--admin-border)] bg-white/95 p-3 backdrop-blur-md lg:hidden">{actions}</div>
      </Form>
    </AdminPage>
  );
}

export function BannerFormPage({ id }: { id?: string }) {
  const query = useBannerQuery(id ?? "");
  if (!id) return <BannerForm />;
  if (query.isError && !query.data) {
    const notFound = query.error instanceof ApiError && (query.error.status === 404 || query.error.status === 422);
    return <AdminPage><PageHeader title="Edit Banner" /><AdminErrorState title={notFound ? "Banner not found" : "Couldn’t load the banner"} description={query.error instanceof ApiError ? query.error.message : "Try again in a moment."} onRetry={notFound ? undefined : () => void query.refetch()} /></AdminPage>;
  }
  if (!query.data) return <AdminPage><PageHeader title="Edit Banner" /><AdminLoadingState label="Loading banner…" /></AdminPage>;
  return <BannerForm key={query.data.updatedAt} banner={query.data} />;
}
