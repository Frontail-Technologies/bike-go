"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, FieldError, Form, Input, Label, Switch, TextField } from "@heroui/react";
import { ArrowLeftIcon, CheckIcon, LinkIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, type FieldPath } from "react-hook-form";
import { AdminButton as Button } from "@/components/admin/controls";
import { AdminErrorState, AdminLoadingState } from "@/components/admin/feedback";
import { FormGrid, FormSection } from "@/components/admin/forms/form-layout";
import { AdminPage, ContentSection, PageHeader } from "@/components/admin/layout";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/error";
import { useLocationMutations, useLocationsQuery } from "../hooks/use-locations";
import { locationFormSchema, type LocationFormValues } from "../schemas/location-schemas";
import type { Location } from "../types/location";
import { mapLinkError, parseMapLink } from "./map-link";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

const initial = (location?: Location): LocationFormValues => ({
  name: location?.name ?? "",
  address: location?.address ?? "",
  city: location?.city ?? "",
  latitude: location?.latitude?.toString() ?? "",
  longitude: location?.longitude?.toString() ?? "",
  active: location?.active ?? true,
});

const fields = [
  ["name", "locations.fields.name", "text"],
  ["city", "locations.fields.city", "text"],
  ["address", "locations.fields.address", "text"],
  ["latitude", "locations.fields.latitude", "number"],
  ["longitude", "locations.fields.longitude", "number"],
] as const satisfies ReadonlyArray<readonly [FieldPath<LocationFormValues>, string, string]>;

function LocationForm({ location }: { location?: Location }) {
  const t = useAdminTranslations();
  const router = useRouter();
  const mutations = useLocationMutations();
  const [error, setError] = useState("");
  const [mapLink, setMapLink] = useState("");
  const [mapLinkMessage, setMapLinkMessage] = useState("");
  const form = useForm<LocationFormValues>({ resolver: zodResolver(locationFormSchema), defaultValues: initial(location) });
  const latitude = form.watch("latitude");
  const longitude = form.watch("longitude");

  function applyMapLink() {
    const found = parseMapLink(mapLink);
    if (!found) { setMapLinkMessage(mapLinkError(mapLink)); return; }
    form.setValue("latitude", String(found.latitude), { shouldValidate: true });
    form.setValue("longitude", String(found.longitude), { shouldValidate: true });
    setMapLink("");
    setMapLinkMessage("");
  }

  const submit = form.handleSubmit(async (values) => {
    setError("");
    const input = { name: values.name, address: values.address, city: values.city, latitude: values.latitude === "" ? null : Number(values.latitude), longitude: values.longitude === "" ? null : Number(values.longitude), active: values.active };
    try {
      const saved = location ? await mutations.update.mutateAsync({ id: location.id, ...input }) : await mutations.create.mutateAsync(input);
      toast.success(t(location ? "locations.updated" : "locations.added", { name: saved.name }));
      router.push("/admin/locations");
    } catch (failure) {
      if (failure instanceof ApiError) {
        let matched = false;
        for (const item of failure.fieldErrors) {
          if (item.path && item.path in initial()) { form.setError(item.path as FieldPath<LocationFormValues>, { message: item.message }); matched = true; }
        }
        setError(matched ? t("common.checkFields") : failure.message);
      } else setError(t("common.genericError"));
    }
  });

  return (
    <Form aria-label={location ? t("locations.editAria") : t("locations.addAria")} onSubmit={submit} className="w-full">
      <ContentSection>
        <div className="space-y-6 p-5">
          {error ? <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>{t("locations.notSaved")}</Alert.Title><Alert.Description>{error}</Alert.Description></Alert.Content></Alert> : null}
          <FormSection title={t("locations.details")} description={t("locations.detailsDescription")}>
            <FormGrid columns={2}>
              {fields.map(([name, label, type]) => (
                <Controller key={name} control={form.control} name={name} render={({ field, fieldState }) => (
                  <TextField name={name} value={String(field.value)} onChange={field.onChange} isRequired={name === "name" || name === "city" || name === "address"} isInvalid={Boolean(fieldState.error)} type={type}>
                    <Label>{t(label)}</Label>
                    <Input variant="secondary" step={type === "number" ? "any" : undefined} />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </TextField>
                )} />
              ))}
            </FormGrid>
            {latitude === "" || longitude === "" ? (
              <div className="mt-5 rounded-xl border border-dashed border-[var(--admin-border-strong)] bg-[var(--admin-surface-muted)] p-4">
                <p className="text-sm font-bold">{t("locations.noCoordinates")}</p>
                <p className="mb-3 text-xs text-[var(--admin-muted)]">{t("locations.coordinatesHint")}</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <TextField aria-label={t("locations.mapLink")} value={mapLink} onChange={(value) => { setMapLink(value); setMapLinkMessage(""); }} isInvalid={Boolean(mapLinkMessage)} className="min-w-0 flex-1">
                    <Input placeholder="https://www.google.com/maps/place/…/@11.5504,104.9212,17z" />
                    <FieldError>{mapLinkMessage}</FieldError>
                  </TextField>
                  <Button type="button" variant="outline" className="min-h-11" onPress={applyMapLink}><LinkIcon size={16} />{t("locations.useLink")}</Button>
                </div>
              </div>
            ) : null}
            <Controller control={form.control} name="active" render={({ field }) => (
              <Switch className="mt-5" isSelected={field.value} onChange={field.onChange}>
                <Switch.Control><Switch.Thumb /></Switch.Control>
                <Switch.Content><Label>{t("locations.active")}</Label></Switch.Content>
              </Switch>
            )} />
          </FormSection>
        </div>
      </ContentSection>
      <div className="mt-5 flex w-full justify-end gap-2">
        <Button onPress={() => router.push("/admin/locations")} variant="tertiary"><ArrowLeftIcon />{t("locations.cancel")}</Button>
        <Button type="submit" variant="primary" isPending={mutations.create.isPending || mutations.update.isPending}><CheckIcon />{location ? t("locations.saveChanges") : t("locations.add")}</Button>
      </div>
    </Form>
  );
}

export function LocationFormPage({ id }: { id?: string }) {
  const t = useAdminTranslations();
  const query = useLocationsQuery();
  const location = id ? query.data?.find((item) => item.id === id) : undefined;
  const title = id ? t("locations.editTitle") : t("locations.add");

  if (id && query.isError && !query.data) return <AdminPage><PageHeader title={title} /><AdminErrorState title={t("locations.loadError")} description={query.error instanceof ApiError ? query.error.message : t("common.retryLater")} onRetry={() => void query.refetch()} /></AdminPage>;
  if (id && !query.data) return <AdminPage><PageHeader title={title} /><AdminLoadingState label={t("locations.loadingLocation")} /></AdminPage>;
  if (id && !location) return <AdminPage><PageHeader title={title} /><AdminErrorState title={t("locations.notFound")} description={t("locations.notFoundDescription")} /></AdminPage>;

  return (
    <AdminPage>
      <PageHeader title={title} description={id ? t("locations.editDescription") : t("locations.addDescription")} />
      <LocationForm key={location?.id ?? "new"} location={location} />
    </AdminPage>
  );
}
