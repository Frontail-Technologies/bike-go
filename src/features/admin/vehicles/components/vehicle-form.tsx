"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Description, FieldError, Form, Input, Label, ListBox, Select, TextArea, TextField } from "@heroui/react";
import { CheckIcon, CurrencyCircleDollarIcon, GaugeIcon, IdentificationCardIcon, InfoIcon, MapPinIcon, StarIcon, TrashIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useForm, type Control, type FieldPath } from "react-hook-form";
import { AdminButton as Button } from "@/components/admin/controls";
import { FormCard, FormGrid } from "@/components/admin/forms/form-layout";
import { ImageUploader } from "@/components/admin/forms/image-uploader";
import { AdminErrorState, AdminLoadingState } from "@/components/admin/feedback";
import { AdminPage, PageHeader } from "@/components/admin/layout";
import { AdminBreadcrumbs } from "@/components/admin/navigation";
import { VehiclePhoto } from "@/components/admin/vehicles/vehicle-photo";
import { toast } from "@/components/ui/toast";
import { useLocationsQuery } from "@/features/admin/locations/hooks/use-locations";
import { ApiError } from "@/lib/api/error";
import { cn } from "@/lib/cn";
import { useVehicleOptions, type Option } from "../hooks/use-vehicle-options";
import { useVehicleMutations, useVehicleQuery } from "../hooks/use-vehicles";
import { blankVehicleForm, capitalize, formValuesToFields, slugify, vehicleToFormValues } from "../lib/vehicle-mappers";
import { vehicleFormSchema, type VehicleFormValues } from "../schemas/vehicle-schemas";
import { vehicleStatuses, type Vehicle } from "../types/vehicle";

const MAX_IMAGES = 10;
type Control_ = Control<VehicleFormValues>;

/** Backend field names that differ from the form's. */
const serverFieldMap: Record<string, FieldPath<VehicleFormValues>> = { dailyRentalPriceMinor: "dailyPrice", securityDepositMinor: "deposit" };

function TextInput({ control, name, label, required = false, type = "text", description, inputMode, onValueChange }: { control: Control_; name: FieldPath<VehicleFormValues>; label: string; required?: boolean; type?: string; description?: string; inputMode?: "decimal" | "numeric"; onValueChange?: (value: string) => void }) {
  return (
    <Controller control={control} name={name} render={({ field, fieldState }) => (
      <TextField name={name} isRequired={required} isInvalid={Boolean(fieldState.error)} type={type} inputMode={inputMode} value={String(field.value ?? "")} onChange={(value) => { field.onChange(value); onValueChange?.(value); }}>
        <Label>{label}</Label><Input />{description ? <Description>{description}</Description> : null}<FieldError>{fieldState.error?.message}</FieldError>
      </TextField>
    )} />
  );
}

function Choice({ control, name, label, options, loading = false, placeholder }: { control: Control_; name: FieldPath<VehicleFormValues>; label: string; options: Option[]; loading?: boolean; placeholder?: string }) {
  return (
    <Controller control={control} name={name} render={({ field, fieldState }) => (
      <Select name={name} placeholder={loading ? "Loading…" : placeholder} value={String(field.value ?? "") || null} onChange={(key) => key !== null && field.onChange(String(key))} isInvalid={Boolean(fieldState.error)} isDisabled={loading}>
        <Label>{label}</Label>
        <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
        <Select.Popover className="adminOverlay"><ListBox>{options.map((option) => <ListBox.Item key={option.value} id={option.value} textValue={option.label}>{option.label}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
        <FieldError>{fieldState.error?.message}</FieldError>
      </Select>
    )} />
  );
}

/** A master-data select; falls back to free text when no masters are configured so the form is never blocked. */
function MasterChoice({ control, name, label, options, loading, required = false }: { control: Control_; name: FieldPath<VehicleFormValues>; label: string; options: Option[]; loading: boolean; required?: boolean }) {
  if (!loading && options.length === 0) return <TextInput control={control} name={name} label={label} required={required} description="No active options are configured in Settings." />;
  return <Choice control={control} name={name} label={label} options={options} loading={loading} placeholder={`Select ${label.toLowerCase()}`} />;
}

type ImageState = { kept: string[]; primaryExisting: string | null; files: File[]; primaryIndex: number | null };

function ExistingImages({ vehicle, kept, primary, onRemove, onPrimary }: { vehicle: Vehicle; kept: string[]; primary: string | null; onRemove: (id: string) => void; onPrimary: (id: string) => void }) {
  const images = kept.map((id) => vehicle.images.find((image) => image.id === id)).filter((image) => image !== undefined);
  if (!images.length) return null;
  return (
    <ul className="mb-3 grid grid-cols-3 gap-2" aria-label="Current images">
      {images.map((image) => (
        <li key={image.id} className="space-y-1.5">
          <div className={cn("relative aspect-[4/3] overflow-hidden rounded-xl border-2 bg-[var(--admin-surface-muted)]", image.id === primary ? "border-[var(--admin-accent)]" : "border-transparent")}>
            {image.url ? <Image src={image.url} alt={image.altText ?? vehicle.name} fill sizes="120px" unoptimized className="object-cover" /> : null}
            {image.id === primary ? <span className="absolute left-1 top-1 flex size-5 items-center justify-center rounded-full bg-[var(--admin-accent)]" aria-label="Primary image"><StarIcon size={11} weight="fill" /></span> : null}
          </div>
          <div className="flex justify-between">
            <Button isIconOnly size="sm" variant="ghost" className="size-9 min-w-9" aria-label="Make primary" isDisabled={image.id === primary} onPress={() => onPrimary(image.id)}><StarIcon size={15} /></Button>
            <Button isIconOnly size="sm" variant="ghost" className="size-9 min-w-9 text-[var(--admin-danger)]" aria-label="Remove image" onPress={() => onRemove(image.id)}><TrashIcon size={15} /></Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function VehicleForm({ vehicle }: { vehicle?: Vehicle }) {
  const router = useRouter();
  const options = useVehicleOptions();
  const locations = useLocationsQuery();
  const mutations = useVehicleMutations();
  const [submitError, setSubmitError] = useState("");
  const [images, setImages] = useState<ImageState>(() => ({ kept: vehicle?.images.map((image) => image.id) ?? [], primaryExisting: vehicle?.images.find((image) => image.isPrimary)?.id ?? vehicle?.images[0]?.id ?? null, files: [], primaryIndex: null }));

  const form = useForm<VehicleFormValues>({ resolver: zodResolver(vehicleFormSchema), defaultValues: vehicle ? vehicleToFormValues(vehicle) : blankVehicleForm });
  const values = form.watch();

  const locationOptions = useMemo<Option[]>(() => {
    const items = (locations.data ?? []).filter((item) => item.active || item.id === vehicle?.location.id);
    return items.map((item) => ({ value: item.id, label: `${item.name} — ${item.city}${item.active ? "" : " (inactive)"}` }));
  }, [locations.data, vehicle?.location.id]);

  const cancel = () => router.push(vehicle ? `/admin/vehicles/${vehicle.id}` : "/admin/vehicles");
  const saving = mutations.create.isPending || mutations.update.isPending;
  const keptExisting = images.kept.length > 0;

  const submit = form.handleSubmit(async (formValues) => {
    setSubmitError("");
    const fields = formValuesToFields(formValues);
    try {
      if (vehicle) {
        const removed = vehicle.images.filter((image) => !images.kept.includes(image.id)).map((image) => image.id);
        const saved = await mutations.update.mutateAsync({
          id: vehicle.id, ...fields, images: images.files,
          removeImageIds: removed,
          imageOrder: images.kept,
          ...(images.primaryIndex !== null ? { primaryImageIndex: images.primaryIndex } : images.primaryExisting && images.primaryExisting !== vehicle.images.find((image) => image.isPrimary)?.id ? { primaryImageId: images.primaryExisting } : {}),
        });
        toast.success(`${saved.name} updated`);
        router.push(`/admin/vehicles/${saved.id}`);
      } else {
        const saved = await mutations.create.mutateAsync({ ...fields, images: images.files, ...(images.primaryIndex !== null ? { primaryImageIndex: images.primaryIndex } : {}) });
        toast.success(`${saved.name} added`);
        router.push(`/admin/vehicles/${saved.id}`);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        let matched = false;
        for (const item of error.fieldErrors) {
          const key = serverFieldMap[item.path ?? ""] ?? item.path;
          if (key && key in blankVehicleForm) { form.setError(key as FieldPath<VehicleFormValues>, { message: item.message }); matched = true; }
        }
        setSubmitError(matched ? "Check the highlighted fields." : error.message);
      } else setSubmitError("Something went wrong. Try again.");
    }
  });

  const price = Number(values.dailyPrice);
  const previewVehicle = { id: vehicle?.id ?? "new", name: values.name || "New vehicle", vehicleType: values.vehicleType, images: vehicle?.images ?? [] };
  const actions = (
    <>
      <Button className="min-h-11 flex-1 xl:flex-none" onPress={cancel} variant="tertiary">Cancel</Button>
      <Button className="min-h-11 flex-[2] xl:flex-none" type="submit" variant="primary" isPending={saving}><CheckIcon />{vehicle ? "Save Changes" : "Save Vehicle"}</Button>
    </>
  );

  return (
    <Form id="vehicle-form" aria-label={vehicle ? "Edit vehicle" : "Add vehicle"} onSubmit={submit} className="block pb-24 xl:pb-0">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
        <div className="space-y-5">
          {submitError ? <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>Vehicle was not saved</Alert.Title><Alert.Description>{submitError}</Alert.Description></Alert.Content></Alert> : null}
          <FormCard title="Basic Information" icon={<InfoIcon size={19} weight="duotone" />}>
            <FormGrid columns={3}>
              <TextInput control={form.control} name="name" label="Vehicle name" required onValueChange={(value) => { if (!vehicle && !form.formState.dirtyFields.slug) form.setValue("slug", slugify(value)); }} />
              <TextInput control={form.control} name="slug" label="URL slug" required description="Lowercase words with dashes" />
              <Choice control={form.control} name="vehicleType" label="Vehicle type" options={options.vehicleTypes(vehicle?.vehicleType)} />
              <MasterChoice control={form.control} name="brand" label="Brand" required options={options.brands(vehicle?.brand)} loading={options.isLoading} />
              <TextInput control={form.control} name="model" label="Model" required />
              <MasterChoice control={form.control} name="category" label="Category" required options={options.categories(vehicle?.category)} loading={options.isLoading} />
            </FormGrid>
            <Controller control={form.control} name="description" render={({ field, fieldState }) => (
              <TextField name="description" value={field.value} onChange={field.onChange} isInvalid={Boolean(fieldState.error)} className="mt-4"><Label>Description</Label><TextArea rows={4} /><FieldError>{fieldState.error?.message}</FieldError></TextField>
            )} />
          </FormCard>
          <FormCard title="Specifications" icon={<GaugeIcon size={19} weight="duotone" />}>
            <FormGrid columns={2}>
              <TextInput control={form.control} name="engineCc" label="Engine cc" type="number" inputMode="numeric" />
              <MasterChoice control={form.control} name="transmission" label="Transmission" options={options.transmissions(vehicle?.transmission ?? undefined)} loading={options.isLoading} />
              <MasterChoice control={form.control} name="fuelType" label="Fuel type" options={options.fuelTypes(vehicle?.fuelType ?? undefined)} loading={options.isLoading} />
              <TextInput control={form.control} name="seats" label="Seats" type="number" inputMode="numeric" />
            </FormGrid>
          </FormCard>
          <FormCard title="Pricing" icon={<CurrencyCircleDollarIcon size={19} weight="duotone" />}>
            <FormGrid columns={2}>
              <TextInput control={form.control} name="dailyPrice" label="Daily rental price (USD)" inputMode="decimal" required />
              <TextInput control={form.control} name="deposit" label="Security deposit (USD)" inputMode="decimal" required />
            </FormGrid>
          </FormCard>
          <FormCard title="Location" icon={<MapPinIcon size={19} weight="duotone" />}>
            <Choice control={form.control} name="locationId" label="Assigned location" options={locationOptions} loading={locations.isLoading} placeholder="Select a location" />
            {locations.isError ? <p role="alert" className="mt-2 text-xs text-[var(--admin-danger)]">Locations could not be loaded.</p> : null}
          </FormCard>
          <FormCard title="Vehicle Information" icon={<IdentificationCardIcon size={19} weight="duotone" />}>
            <FormGrid columns={2}>
              <TextInput control={form.control} name="registrationNumber" label="Registration number" required />
              <Choice control={form.control} name="status" label="Status" options={vehicleStatuses.map((value) => ({ value, label: capitalize(value) }))} />
            </FormGrid>
          </FormCard>
        </div>
        <div className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <FormCard title="Vehicle Images" description="Upload clear photos of the vehicle (front, back, sides).">
            {vehicle ? <ExistingImages vehicle={vehicle} kept={images.kept} primary={images.primaryExisting} onRemove={(id) => setImages((current) => { const kept = current.kept.filter((item) => item !== id); return { ...current, kept, primaryExisting: current.primaryExisting === id ? kept[0] ?? null : current.primaryExisting }; })} onPrimary={(id) => setImages((current) => ({ ...current, primaryExisting: id, primaryIndex: null }))} /> : null}
            <ImageUploader
              limit={Math.max(1, MAX_IMAGES - images.kept.length)}
              emptyTitle={keptExisting ? "Add more images" : "Click to upload images"}
              onChange={(files) => setImages((current) => ({ ...current, files, primaryIndex: current.primaryIndex !== null && current.primaryIndex < files.length ? current.primaryIndex : null }))}
              onPrimaryChange={(file) => setImages((current) => {
                // While stored images exist, the stored grid owns "primary"; new files are appended.
                if (current.kept.length > 0) return current;
                const index = file ? current.files.indexOf(file) : -1;
                return { ...current, primaryIndex: index >= 0 ? index : null };
              })}
              onReorder={(files) => setImages((current) => ({ ...current, files }))}
            />
            <p className="mt-3 text-xs leading-5 text-[var(--admin-muted)]">{images.files.length ? `${images.files.length} new image${images.files.length === 1 ? "" : "s"} will be uploaded when you save. ` : ""}Up to {MAX_IMAGES} images per vehicle.</p>
          </FormCard>
          <section aria-label="Listing preview" className="adminSurface hidden overflow-hidden rounded-2xl xl:block">
            <VehiclePhoto vehicle={previewVehicle} className="aspect-[16/9] w-full" sizes="320px" />
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0"><p className="truncate text-sm font-extrabold">{previewVehicle.name}</p><p className="truncate text-xs text-[var(--admin-muted)]">{[values.brand, values.model].filter(Boolean).join(" ") || "Brand and model"}</p></div>
              <p className="shrink-0 text-lg font-extrabold">{Number.isFinite(price) && price > 0 ? `$${price.toFixed(2)}` : "—"}<span className="ml-0.5 text-xs font-medium text-[var(--admin-muted)]">/ day</span></p>
            </div>
          </section>
          <div className="hidden gap-2 xl:flex">{actions}</div>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-[var(--admin-border)] bg-white/95 p-3 backdrop-blur-md xl:hidden">{actions}</div>
    </Form>
  );
}

export function VehicleFormPage({ id }: { id?: string }) {
  const query = useVehicleQuery(id ?? "");
  const vehicle = id ? query.data : undefined;
  const crumbs = [{ label: "Vehicles", href: "/admin/vehicles" }, ...(vehicle ? [{ label: vehicle.name, href: `/admin/vehicles/${vehicle.id}` }] : []), { label: id ? "Edit" : "Add Vehicle" }];

  let body;
  if (id && query.isError) body = <AdminErrorState title={query.error instanceof ApiError && query.error.status === 404 ? "Vehicle not found" : "Couldn’t load the vehicle"} description={query.error instanceof ApiError ? query.error.message : "Try again in a moment."} onRetry={() => void query.refetch()} />;
  else if (id && !vehicle) body = <AdminLoadingState label="Loading vehicle…" />;
  else body = <VehicleForm key={vehicle?.updatedAt ?? "new"} vehicle={vehicle} />;

  return (
    <AdminPage>
      <AdminBreadcrumbs items={crumbs} />
      <PageHeader title={id ? "Edit Vehicle" : "Add New Vehicle"} description={id ? "Update the vehicle catalogue record." : "Fill in the details to add a new vehicle to your fleet."} />
      {body}
    </AdminPage>
  );
}
