"use client";

import { Button, Drawer, FieldError, Form, Input, Label, TextArea, TextField } from "@heroui/react";
import { useState } from "react";
import { z } from "zod";
import type { Customer } from "./customer-data";

const schema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters."),
  phone: z.string().trim().regex(/^\+?[0-9 ]{8,16}$/, "Enter a valid phone number."),
  email: z.string().trim().email("Enter a valid email address."),
  dateOfBirth: z.string().min(1, "Date of birth is required."),
  nationality: z.string().trim().min(2, "Nationality is required."),
  city: z.string().trim().min(2, "City is required."),
  address: z.string().trim().max(200, "Use at most 200 characters."),
});
type Values = z.infer<typeof schema>;
type Errors = Partial<Record<keyof Values, string>>;

const valuesOf = (customer: Customer): Values => ({ name: customer.name, phone: customer.phone, email: customer.email, dateOfBirth: customer.dateOfBirth, nationality: customer.nationality, city: customer.city, address: customer.address });

function Field({ label, name, values, errors, change, type = "text", required = true }: { label: string; name: keyof Values; values: Values; errors: Errors; change: (name: keyof Values, value: string) => void; type?: string; required?: boolean }) {
  return <TextField name={name} isRequired={required} isInvalid={Boolean(errors[name])} value={values[name]} onChange={(value) => change(name, value)}><Label>{label}</Label><Input type={type} /><FieldError>{errors[name]}</FieldError></TextField>;
}

export function CustomerEditDrawer({ customer, isOpen, onOpenChange, onSave }: { customer: Customer | null; isOpen: boolean; onOpenChange: (open: boolean) => void; onSave: (id: string, values: Values) => void }) {
  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay">
      <Drawer.Content placement="right" className="w-full max-w-md">
        <Drawer.Dialog aria-label="Edit customer">
          <Drawer.CloseTrigger />
          {customer ? <EditForm key={customer.id} customer={customer} onCancel={() => onOpenChange(false)} onSave={(values) => { onSave(customer.id, values); onOpenChange(false); }} /> : null}
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}

function EditForm({ customer, onCancel, onSave }: { customer: Customer; onCancel: () => void; onSave: (values: Values) => void }) {
  const [values, setValues] = useState<Values>(() => valuesOf(customer));
  const [errors, setErrors] = useState<Errors>({});
  const change = (name: keyof Values, value: string) => { setValues((current) => ({ ...current, [name]: value })); setErrors((current) => ({ ...current, [name]: undefined })); };

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = schema.safeParse(values);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(fields).map(([key, messages]) => [key, messages?.[0]])) as Errors);
      return;
    }
    onSave(result.data);
  }

  const shared = { values, errors, change };
  return (
    <Form validationBehavior="aria" validationErrors={errors} onSubmit={submit} className="contents">
      <Drawer.Header><Drawer.Heading>Edit customer</Drawer.Heading></Drawer.Header>
      <Drawer.Body className="space-y-6">
        <section aria-label="Basic information" className="space-y-4">
          <h3 className="text-sm font-extrabold">Basic Information</h3>
          <Field label="Full name" name="name" {...shared} />
          <Field label="Phone number" name="phone" {...shared} />
          <Field label="Email address" name="email" type="email" {...shared} />
          <Field label="Date of birth" name="dateOfBirth" type="date" {...shared} />
        </section>
        <section aria-label="Location and profile" className="space-y-4">
          <h3 className="text-sm font-extrabold">Location & Profile</h3>
          <Field label="Nationality" name="nationality" {...shared} />
          <Field label="City" name="city" {...shared} />
          <TextField name="address" isInvalid={Boolean(errors.address)} value={values.address} onChange={(value) => change("address", value)}><Label>Address</Label><TextArea rows={3} /><FieldError>{errors.address}</FieldError></TextField>
        </section>
        <p className="text-xs text-[var(--admin-muted)]">Demo only — changes reset after reload. Sign-in identity, role and history can’t be edited here.</p>
      </Drawer.Body>
      <Drawer.Footer className="grid grid-cols-2 gap-2">
        <Button type="button" variant="tertiary" className="min-h-11" onPress={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" className="min-h-11">Save Changes</Button>
      </Drawer.Footer>
    </Form>
  );
}
