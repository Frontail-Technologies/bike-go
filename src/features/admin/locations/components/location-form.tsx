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

const initial = (location?: Location): LocationFormValues => ({
  name: location?.name ?? "",
  address: location?.address ?? "",
  city: location?.city ?? "",
  latitude: location?.latitude?.toString() ?? "",
  longitude: location?.longitude?.toString() ?? "",
  active: location?.active ?? true,
});

const fields = [
  ["name", "Location name", "text"],
  ["city", "City", "text"],
  ["address", "Address", "text"],
  ["latitude", "Latitude", "number"],
  ["longitude", "Longitude", "number"],
] as const satisfies ReadonlyArray<readonly [FieldPath<LocationFormValues>, string, string]>;

function LocationForm({ location }: { location?: Location }) {
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
      toast.success(location ? `${saved.name} updated` : `${saved.name} added`);
      router.push("/admin/locations");
    } catch (failure) {
      if (failure instanceof ApiError) {
        let matched = false;
        for (const item of failure.fieldErrors) {
          if (item.path && item.path in initial()) { form.setError(item.path as FieldPath<LocationFormValues>, { message: item.message }); matched = true; }
        }
        setError(matched ? "Check the highlighted fields." : failure.message);
      } else setError("Something went wrong. Try again.");
    }
  });

  return (
    <Form aria-label={location ? "Edit location" : "Add location"} onSubmit={submit} className="w-full">
      <ContentSection>
        <div className="space-y-6 p-5">
          {error ? <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>Location was not saved</Alert.Title><Alert.Description>{error}</Alert.Description></Alert.Content></Alert> : null}
          <FormSection title="Location details" description="Use the address and coordinates stored by the RideGo backend.">
            <FormGrid columns={2}>
              {fields.map(([name, label, type]) => (
                <Controller key={name} control={form.control} name={name} render={({ field, fieldState }) => (
                  <TextField name={name} value={String(field.value)} onChange={field.onChange} isRequired={name === "name" || name === "city" || name === "address"} isInvalid={Boolean(fieldState.error)} type={type}>
                    <Label>{label}</Label>
                    <Input variant="secondary" step={type === "number" ? "any" : undefined} />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </TextField>
                )} />
              ))}
            </FormGrid>
            {latitude === "" || longitude === "" ? (
              <div className="mt-5 rounded-xl border border-dashed border-[var(--admin-border-strong)] bg-[var(--admin-surface-muted)] p-4">
                <p className="text-sm font-bold">No coordinates yet</p>
                <p className="mb-3 text-xs text-[var(--admin-muted)]">Paste a map link and the latitude and longitude are filled in for you.</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <TextField aria-label="Map link" value={mapLink} onChange={(value) => { setMapLink(value); setMapLinkMessage(""); }} isInvalid={Boolean(mapLinkMessage)} className="min-w-0 flex-1">
                    <Input placeholder="https://www.google.com/maps/place/…/@11.5504,104.9212,17z" />
                    <FieldError>{mapLinkMessage}</FieldError>
                  </TextField>
                  <Button type="button" variant="outline" className="min-h-11" onPress={applyMapLink}><LinkIcon size={16} />Use link</Button>
                </div>
              </div>
            ) : null}
            <Controller control={form.control} name="active" render={({ field }) => (
              <Switch className="mt-5" isSelected={field.value} onChange={field.onChange}>
                <Switch.Control><Switch.Thumb /></Switch.Control>
                <Switch.Content><Label>Active location</Label></Switch.Content>
              </Switch>
            )} />
          </FormSection>
        </div>
      </ContentSection>
      <div className="mt-5 flex w-full justify-end gap-2">
        <Button onPress={() => router.push("/admin/locations")} variant="tertiary"><ArrowLeftIcon />Cancel</Button>
        <Button type="submit" variant="primary" isPending={mutations.create.isPending || mutations.update.isPending}><CheckIcon />{location ? "Save Changes" : "Add Location"}</Button>
      </div>
    </Form>
  );
}

export function LocationFormPage({ id }: { id?: string }) {
  const query = useLocationsQuery();
  const location = id ? query.data?.find((item) => item.id === id) : undefined;
  const title = id ? "Edit Location" : "Add Location";

  if (id && query.isError && !query.data) return <AdminPage><PageHeader title={title} /><AdminErrorState title="Couldn’t load the location" description={query.error instanceof ApiError ? query.error.message : "Try again in a moment."} onRetry={() => void query.refetch()} /></AdminPage>;
  if (id && !query.data) return <AdminPage><PageHeader title={title} /><AdminLoadingState label="Loading location…" /></AdminPage>;
  if (id && !location) return <AdminPage><PageHeader title={title} /><AdminErrorState title="Location not found" description="This location does not exist or is no longer available." /></AdminPage>;

  return (
    <AdminPage>
      <PageHeader title={title} description={id ? "Update this pickup and return location." : "Create a Cambodia pickup and return location."} />
      <LocationForm key={location?.id ?? "new"} location={location} />
    </AdminPage>
  );
}
