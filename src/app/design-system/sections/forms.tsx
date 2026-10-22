"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EnvelopeSimpleIcon, PhoneIcon, UserIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { AppSearchField } from "@/components/ui/search-field";
import { AppSelect } from "@/components/ui/select";
import { Checkbox, RadioGroup, Switch } from "@/components/ui/selection-controls";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { TextInput } from "@/components/ui/text-field";
import { toast } from "@/components/ui/toast";
import { Demo, Section } from "../section";

const schema = z.object({
  name: z.string().min(2, "Enter your full name."),
  email: z.email("Enter a valid email address."),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number."),
});
type FormValues = z.infer<typeof schema>;

const brands = [
  { id: "royal-enfield", label: "Royal Enfield" },
  { id: "yamaha", label: "Yamaha" },
  { id: "ktm", label: "KTM" },
  { id: "honda", label: "Honda" },
  { id: "tvs", label: "TVS" },
];

export function FormsSection() {
  const { control, handleSubmit, reset, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { name: "", email: "", phone: "" },
  });
  const [brand, setBrand] = useState<string>("royal-enfield");
  const [unit, setUnit] = useState("day");
  const [engine, setEngine] = useState("200-400");
  const [abs, setAbs] = useState(true);
  const [gps, setGps] = useState(false);
  const [notify, setNotify] = useState(true);
  const [query, setQuery] = useState("");

  return (
    <Section id="forms" title="Forms" description="Visible labels, errors below the field, 44px+ controls, 16px text so iOS never zooms.">
      <div className="grid gap-8 md:grid-cols-2">
        <Demo title="Validated form · React Hook Form + Zod">
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={handleSubmit((values) => {
              toast.success("Details saved", { description: `We will contact ${values.name} on ${values.phone}.` });
              reset();
            })}
          >
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <TextInput
                  label="Full name"
                  placeholder="Rahul Sharma"
                  autoComplete="name"
                  startIcon={<UserIcon size={20} />}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  isInvalid={fieldState.invalid}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="email"
              control={control}
              render={({ field, fieldState }) => (
                <TextInput
                  label="Email"
                  type="email"
                  placeholder="rahul@example.com"
                  autoComplete="email"
                  inputMode="email"
                  startIcon={<EnvelopeSimpleIcon size={20} />}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  isInvalid={fieldState.invalid}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="phone"
              control={control}
              render={({ field, fieldState }) => (
                <TextInput
                  label="Mobile number"
                  type="tel"
                  placeholder="9876543210"
                  autoComplete="tel-national"
                  inputMode="numeric"
                  description="We only use this for pickup updates."
                  startIcon={<PhoneIcon size={20} />}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  isInvalid={fieldState.invalid}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Button type="submit" fullWidth isPending={formState.isSubmitting}>
              Save details
            </Button>
          </form>
        </Demo>

        <div className="flex flex-col gap-8">
          <Demo title="Search and select" className="flex flex-col gap-4">
            <AppSearchField value={query} onChange={setQuery} />
            <p className="text-xs text-subtle" aria-live="polite">
              {query ? `Searching for “${query}”` : "Type to search; the clear button appears."}
            </p>
            <AppSelect
              label="Brand"
              options={brands}
              value={brand}
              onChange={(key) => key && setBrand(String(key))}
            />
          </Demo>

          <Demo title="Segmented control">
            <SegmentedControl
              aria-label="Price unit"
              value={unit}
              onChange={setUnit}
              options={[
                { id: "hour", label: "Hour" },
                { id: "day", label: "Day" },
                { id: "week", label: "Week" },
              ]}
            />
          </Demo>
        </div>
      </div>

      <Demo title="Selection controls">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="flex flex-col">
            <Checkbox isSelected={abs} onChange={setAbs}>
              ABS
            </Checkbox>
            <Checkbox isSelected={gps} onChange={setGps}>
              GPS tracker
            </Checkbox>
          </div>
          <RadioGroup
            label="Engine capacity"
            value={engine}
            onChange={setEngine}
            options={[
              { value: "under-200", label: "Under 200cc" },
              { value: "200-400", label: "200 – 400cc" },
              { value: "over-400", label: "Over 400cc" },
            ]}
          />
          <div className="flex flex-col">
            <Switch isSelected={notify} onChange={setNotify}>
              Booking reminders
            </Switch>
          </div>
        </div>
      </Demo>
    </Section>
  );
}
