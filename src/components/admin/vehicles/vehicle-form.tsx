"use client";

import { Alert, Button, Description, FieldError, Form, Input, Label, ListBox, Select, TextArea, TextField } from "@heroui/react";
import { CheckIcon, CurrencyCircleDollarIcon, GaugeIcon, IdentificationCardIcon, InfoIcon, MapPinIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { adminLocations, adminVehicles, type AdminLocation, type AdminVehicle, type VehicleInput, type VehicleStatus } from "@/components/admin/data";
import { ImageUploader } from "@/components/admin/forms/image-uploader";
import { FormCard, FormGrid } from "@/components/admin/forms/form-layout";
import { AdminErrorState } from "@/components/admin/feedback";
import { AdminPage, PageHeader } from "@/components/admin/layout";
import { AdminBreadcrumbs } from "@/components/admin/navigation";
import { VehiclePhoto } from "@/components/admin/vehicles/vehicle-photo";

const schema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters."),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by dashes."),
  vehicleType: z.enum(["motorcycle", "scooter", "car", "other"]),
  brand: z.string().trim().min(1, "Brand is required."), model: z.string().trim().min(1, "Model is required."), category: z.string().trim().min(1, "Category is required."),
  description: z.string().trim().max(4000).optional(), engineCc: z.string(), transmission: z.string(), fuelType: z.string(), seats: z.string(),
  dailyPrice: z.string().min(1, "Daily price is required."), deposit: z.string().min(1, "Deposit is required."),
  locationId: z.string().uuid("Choose a location."), registrationNumber: z.string().trim().min(2, "Registration number is required."), status: z.enum(["available", "rented", "maintenance", "inactive"]),
});
type RawForm = z.infer<typeof schema>;

const blank: RawForm = { name: "", slug: "", vehicleType: "motorcycle", brand: "", model: "", category: "", description: "", engineCc: "", transmission: "", fuelType: "", seats: "", dailyPrice: "", deposit: "", locationId: "", registrationNumber: "", status: "available" };
const toRaw = (vehicle: AdminVehicle): RawForm => ({ name: vehicle.name, slug: vehicle.slug, vehicleType: vehicle.vehicleType, brand: vehicle.brand, model: vehicle.model, category: vehicle.category, description: vehicle.description ?? "", engineCc: vehicle.engineCc?.toString() ?? "", transmission: vehicle.transmission ?? "", fuelType: vehicle.fuelType ?? "", seats: vehicle.seats?.toString() ?? "", dailyPrice: (vehicle.dailyRentalPriceMinor / 100).toString(), deposit: (vehicle.securityDepositMinor / 100).toString(), locationId: vehicle.location.id, registrationNumber: vehicle.registrationNumber, status: vehicle.status });

function Field({ label, name, value, onChange, error, required = false, type = "text", description }: { label: string; name: keyof RawForm; value: string; onChange: (name: keyof RawForm, value: string) => void; error?: string; required?: boolean; type?: string; description?: string }) {
  return <TextField name={name} isRequired={required} isInvalid={Boolean(error)} type={type} value={value} onChange={(next) => onChange(name, next)}><Label>{label}</Label><Input />{description ? <Description>{description}</Description> : null}<FieldError>{error}</FieldError></TextField>;
}
function Choice({ label, name, value, onChange, options, error }: { label: string; name: keyof RawForm; value: string; onChange: (name: keyof RawForm, value: string) => void; options: Array<{ value: string; label: string }>; error?: string }) {
  return <Select name={name} value={value} onChange={(key) => key !== null && onChange(name, String(key))} isInvalid={Boolean(error)}><Label>{label}</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger><Select.Popover className="adminOverlay"><ListBox>{options.map((option) => <ListBox.Item key={option.value} id={option.value} textValue={option.label}>{option.label}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover><FieldError>{error}</FieldError></Select>;
}

export function VehicleForm({ vehicle }: { vehicle?: AdminVehicle }) {
  const router = useRouter();
  const [form, setForm] = useState<RawForm>(() => vehicle ? toRaw(vehicle) : { ...blank, locationId: adminLocations[0]?.id ?? "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const [localImages, setLocalImages] = useState<File[]>([]);
  function change(name: keyof RawForm, value: string) { setForm((current) => ({ ...current, [name]: value })); setErrors((current) => ({ ...current, [name]: "" })); }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]))); return; }
    const values = parsed.data;
    const daily = Number(values.dailyPrice); const deposit = Number(values.deposit);
    const nextErrors: Record<string, string> = {};
    if (!Number.isFinite(daily) || daily <= 0) nextErrors.dailyPrice = "Enter a price greater than zero.";
    if (!Number.isFinite(deposit) || deposit < 0) nextErrors.deposit = "Enter zero or a positive deposit.";
    if (values.engineCc && (!Number.isInteger(Number(values.engineCc)) || Number(values.engineCc) < 1)) nextErrors.engineCc = "Enter a positive whole number.";
    if (values.seats && (!Number.isInteger(Number(values.seats)) || Number(values.seats) < 1)) nextErrors.seats = "Enter a positive whole number.";
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }
    const input: VehicleInput = { slug: values.slug, vehicleType: values.vehicleType, name: values.name, brand: values.brand, model: values.model, category: values.category, description: values.description || null, engineCc: values.engineCc ? Number(values.engineCc) : null, transmission: values.transmission || null, fuelType: values.fuelType || null, seats: values.seats ? Number(values.seats) : null, dailyRentalPriceMinor: Math.round(daily * 100), securityDepositMinor: Math.round(deposit * 100), currency: "USD", registrationNumber: values.registrationNumber, locationId: values.locationId, status: values.status, specifications: {} };
    setSaving(true); setSubmitError("");
    await new Promise((resolve) => setTimeout(resolve, 250));
    void input;
    router.push(vehicle ? `/admin/vehicles/${vehicle.id}` : "/admin/vehicles"); router.refresh();
    setSaving(false);
  }
  const cancel = () => router.push(vehicle ? `/admin/vehicles/${vehicle.id}` : "/admin/vehicles");
  const previewVehicle = { id: vehicle?.id ?? "new", name: form.name || "New vehicle", vehicleType: form.vehicleType, images: vehicle?.images ?? [] };
  const previewPrice = Number(form.dailyPrice);
  const actions = (
    <>
      <Button className="min-h-11 flex-1 xl:flex-none" onPress={cancel} variant="tertiary">Cancel</Button>
      <Button className="min-h-11 flex-[2] xl:flex-none" type="submit" variant="primary" isPending={saving}><CheckIcon />{vehicle ? "Save Changes" : "Save Vehicle"}</Button>
    </>
  );
  return <Form id="vehicle-form" aria-label={vehicle ? "Edit vehicle" : "Add vehicle"} validationBehavior="aria" validationErrors={errors} onSubmit={submit} className="block pb-24 xl:pb-0">
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
      <div className="space-y-5">
        {submitError ? <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>Vehicle was not saved</Alert.Title><Alert.Description>{submitError}</Alert.Description></Alert.Content></Alert> : null}
        <FormCard title="Basic Information" icon={<InfoIcon size={19} weight="duotone" />}>
          <FormGrid columns={3}>
            <Field label="Vehicle name" name="name" value={form.name} onChange={change} error={errors.name} required />
            <Field label="URL slug" name="slug" value={form.slug} onChange={change} error={errors.slug} required description="Lowercase words with dashes" />
            <Choice label="Vehicle type" name="vehicleType" value={form.vehicleType} onChange={change} error={errors.vehicleType} options={["motorcycle", "scooter", "car", "other"].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))} />
            <Field label="Brand" name="brand" value={form.brand} onChange={change} error={errors.brand} required />
            <Field label="Model" name="model" value={form.model} onChange={change} error={errors.model} required />
            <Field label="Category" name="category" value={form.category} onChange={change} error={errors.category} required />
          </FormGrid>
          <TextField name="description" value={form.description} onChange={(value) => change("description", value)} className="mt-4"><Label>Description</Label><TextArea rows={4} /><FieldError>{errors.description}</FieldError></TextField>
        </FormCard>
        <FormCard title="Specifications" icon={<GaugeIcon size={19} weight="duotone" />}>
          <FormGrid columns={2}>
            <Field label="Engine cc" name="engineCc" value={form.engineCc} onChange={change} error={errors.engineCc} type="number" />
            <Field label="Transmission" name="transmission" value={form.transmission} onChange={change} error={errors.transmission} />
            <Field label="Fuel type" name="fuelType" value={form.fuelType} onChange={change} error={errors.fuelType} />
            <Field label="Seats" name="seats" value={form.seats} onChange={change} error={errors.seats} type="number" />
          </FormGrid>
        </FormCard>
        <FormCard title="Pricing" icon={<CurrencyCircleDollarIcon size={19} weight="duotone" />}>
          <FormGrid columns={2}>
            <Field label="Daily rental price (USD)" name="dailyPrice" value={form.dailyPrice} onChange={change} error={errors.dailyPrice} type="number" required />
            <Field label="Security deposit (USD)" name="deposit" value={form.deposit} onChange={change} error={errors.deposit} type="number" required />
          </FormGrid>
        </FormCard>
        <FormCard title="Location" icon={<MapPinIcon size={19} weight="duotone" />}>
          <Choice label="Assigned location" name="locationId" value={form.locationId} onChange={change} error={errors.locationId} options={adminLocations.map((item: AdminLocation) => ({ value: item.id, label: `${item.name} — ${item.city}` }))} />
        </FormCard>
        <FormCard title="Vehicle Information" icon={<IdentificationCardIcon size={19} weight="duotone" />}>
          <FormGrid columns={2}>
            <Field label="Registration number" name="registrationNumber" value={form.registrationNumber} onChange={change} error={errors.registrationNumber} required />
            <Choice label="Status" name="status" value={form.status} onChange={change} options={(["available", "rented", "maintenance", "inactive"] as VehicleStatus[]).map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))} />
          </FormGrid>
        </FormCard>
      </div>
      <div className="space-y-5 xl:sticky xl:top-24 xl:self-start">
        <FormCard title="Vehicle Images" description="Upload clear photos of the vehicle (front, back, sides).">
          <ImageUploader onChange={setLocalImages} />
          <p className="mt-3 text-xs leading-5 text-[var(--admin-muted)]">{localImages.length ? `${localImages.length} local image${localImages.length === 1 ? "" : "s"} selected. ` : ""}Images remain local in this UI-only build.{vehicle?.images.length ? ` ${vehicle.images.length} stored image${vehicle.images.length === 1 ? "" : "s"} remain unchanged.` : ""}</p>
        </FormCard>
        <section aria-label="Listing preview" className="adminSurface hidden overflow-hidden rounded-2xl xl:block">
          <VehiclePhoto vehicle={previewVehicle} className="aspect-[16/9] w-full" sizes="320px" />
          <div className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0"><p className="truncate text-sm font-extrabold">{previewVehicle.name}</p><p className="truncate text-xs text-[var(--admin-muted)]">{[form.brand, form.model].filter(Boolean).join(" ") || "Brand and model"}</p></div>
            <p className="shrink-0 text-lg font-extrabold">{Number.isFinite(previewPrice) && previewPrice > 0 ? `$${previewPrice.toFixed(2)}` : "—"}<span className="ml-0.5 text-xs font-medium text-[var(--admin-muted)]">/ day</span></p>
          </div>
        </section>
        <div className="hidden gap-2 xl:flex">{actions}</div>
      </div>
    </div>
    <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-[var(--admin-border)] bg-white/95 p-3 backdrop-blur-md xl:hidden">{actions}</div>
  </Form>;
}

export function VehicleFormPage({ id }: { id?: string }) {
  const vehicle = id ? adminVehicles.find((item) => item.id === id) : undefined;
  const crumbs = [{ label: "Vehicles", href: "/admin/vehicles" }, ...(vehicle ? [{ label: vehicle.name, href: `/admin/vehicles/${vehicle.id}` }] : []), { label: id ? "Edit" : "Add Vehicle" }];
  return <AdminPage>
    <AdminBreadcrumbs items={crumbs} />
    <PageHeader title={id ? "Edit Vehicle" : "Add New Vehicle"} description={id ? "Update the vehicle catalogue record." : "Fill in the details to add a new vehicle to your fleet."} />
    {id && !vehicle ? <AdminErrorState title="Vehicle not found" description="This UI preview does not contain that vehicle." /> : <VehicleForm vehicle={vehicle} />}
  </AdminPage>;
}
