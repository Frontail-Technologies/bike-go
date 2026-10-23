"use client";

import {
  Alert,
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Switch,
  TextField,
} from "@heroui/react";
import { ArrowLeftIcon, CheckIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { adminLocations, type AdminLocation } from "@/components/admin/data";
import { FormGrid, FormSection } from "@/components/admin/forms/form-layout";
import { AdminErrorState } from "@/components/admin/feedback";
import {
  AdminPage,
  ContentSection,
  PageHeader,
} from "@/components/admin/layout";

const schema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters."),
  address: z.string().trim().min(3, "Enter the street address."),
  city: z.string().trim().min(2, "Enter a city."),
  latitude: z.string(),
  longitude: z.string(),
  active: z.boolean(),
});
type Raw = z.infer<typeof schema>;
const initial = (location?: AdminLocation): Raw => ({
  name: location?.name ?? "",
  address: location?.address ?? "",
  city: location?.city ?? "",
  latitude: location?.latitude?.toString() ?? "",
  longitude: location?.longitude?.toString() ?? "",
  active: location?.active ?? true,
});

function LocationForm({ location }: { location?: AdminLocation }) {
  const router = useRouter();
  const [form, setForm] = useState<Raw>(() => initial(location));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  function change(name: keyof Raw, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [
            String(issue.path[0]),
            issue.message,
          ]),
        ),
      );
      return;
    }
    const latitude = form.latitude === "" ? null : Number(form.latitude);
    const longitude = form.longitude === "" ? null : Number(form.longitude);
    const next: Record<string, string> = {};
    if (
      latitude !== null &&
      (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)
    )
      next.latitude = "Latitude must be between -90 and 90.";
    if (
      longitude !== null &&
      (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)
    )
      next.longitude = "Longitude must be between -180 and 180.";
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    setSaving(true);
    setError("");
    await new Promise((resolve) => setTimeout(resolve, 250));
    void latitude;
    void longitude;
    router.push("/admin/locations");
    router.refresh();
    setSaving(false);
  }
  return (
    <Form
      aria-label={location ? "Edit location" : "Add location"}
      validationBehavior="aria"
      validationErrors={errors}
      onSubmit={submit}
      className="w-full"
    >
      <ContentSection>
        <div className="space-y-6 p-5">
          {error ? (
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Location was not saved</Alert.Title>
                <Alert.Description>{error}</Alert.Description>
              </Alert.Content>
            </Alert>
          ) : null}
          <FormSection
            title="Location details"
            description="Use the address and coordinates stored by the RideGo backend."
          >
            <FormGrid columns={2}>
              {(
                [
                  ["name", "Location name", "text"],
                  ["city", "City", "text"],
                  ["address", "Address", "text"],
                  ["latitude", "Latitude", "number"],
                  ["longitude", "Longitude", "number"],
                ] as const
              ).map(([name, label, type]) => (
                <TextField
                  key={name}
                  name={name}
                  value={String(form[name])}
                  onChange={(value) => change(name, value)}
                  isRequired={
                    name === "name" || name === "city" || name === "address"
                  }
                  isInvalid={Boolean(errors[name])}
                  type={type}
                >
                  <Label>{label}</Label>
                  <Input variant="secondary" />
                  <FieldError>{errors[name]}</FieldError>
                </TextField>
              ))}
            </FormGrid>
            <Switch
              className="mt-5"
              isSelected={form.active}
              onChange={(selected) => change("active", selected)}
            >
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <Switch.Content>
                <Label>Active location</Label>
              </Switch.Content>
            </Switch>
          </FormSection>
        </div>
      </ContentSection>
      <div className="mt-5 flex w-full justify-end gap-2">
        <Button onPress={() => router.push("/admin/locations")} variant="tertiary">
          <ArrowLeftIcon />
          Cancel
        </Button>
        <Button type="submit" variant="primary" isPending={saving}>
          <CheckIcon />
          {location ? "Save Changes" : "Add Location"}
        </Button>
      </div>
    </Form>
  );
}

export function LocationFormPage({ id }: { id?: string }) {
  const location = id
    ? adminLocations.find((item) => item.id === id)
    : undefined;
  if (id && !location)
    return (
      <AdminPage>
        <PageHeader title="Edit Location" />
        <AdminErrorState
          title="Location not found"
          description="This location does not exist or is no longer available."
        />
      </AdminPage>
    );
  return (
    <AdminPage>
      <PageHeader
        title={id ? "Edit Location" : "Add Location"}
        description={
          id
            ? "Update this pickup and return location."
            : "Create a Cambodia pickup and return location."
        }
      />
      <LocationForm location={location} />
    </AdminPage>
  );
}
