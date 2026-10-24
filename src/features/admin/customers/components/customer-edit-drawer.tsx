"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Drawer, FieldError, Form, Input, Label, TextArea, TextField } from "@heroui/react";
import { useState } from "react";
import { Controller, useForm, type FieldPath } from "react-hook-form";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/error";
import { useCustomerMutations } from "../hooks/use-customers";
import { customerToFormValues, formValuesToInput } from "../lib/customer-model";
import { customerEditSchema, type CustomerEditValues } from "../schemas/customer-schemas";
import type { Customer } from "../types/customer";

function Field({ form, name, label, type = "text", required = false }: { form: ReturnType<typeof useForm<CustomerEditValues>>; name: FieldPath<CustomerEditValues>; label: string; type?: string; required?: boolean }) {
  return (
    <Controller control={form.control} name={name} render={({ field, fieldState }) => (
      <TextField name={name} isRequired={required} isInvalid={Boolean(fieldState.error)} value={field.value} onChange={field.onChange}>
        <Label>{label}</Label><Input type={type} /><FieldError>{fieldState.error?.message}</FieldError>
      </TextField>
    )} />
  );
}

function EditForm({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const mutations = useCustomerMutations();
  const [error, setError] = useState("");
  const form = useForm<CustomerEditValues>({ resolver: zodResolver(customerEditSchema), defaultValues: customerToFormValues(customer) });

  const submit = form.handleSubmit(async (values) => {
    setError("");
    try {
      const saved = await mutations.update.mutateAsync({ id: customer.id, ...formValuesToInput(values) });
      toast.success(`${saved.name} updated`);
      onClose();
    } catch (failure) {
      if (failure instanceof ApiError) {
        let matched = false;
        for (const item of failure.fieldErrors) {
          const key = item.path === "fullName" || item.path === "phone" || item.path === "email" || item.path === "dateOfBirth" || item.path === "nationality" || item.path === "city" || item.path === "address" ? item.path : undefined;
          if (key) { form.setError(key, { message: item.message }); matched = true; }
        }
        setError(matched ? "Check the highlighted fields." : failure.message);
      } else setError("Something went wrong. Try again.");
    }
  });

  return (
    <Form onSubmit={submit} className="contents">
      <Drawer.Header><Drawer.Heading>Edit customer</Drawer.Heading></Drawer.Header>
      <Drawer.Body className="space-y-6">
        {error ? <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>Customer was not saved</Alert.Title><Alert.Description>{error}</Alert.Description></Alert.Content></Alert> : null}
        <section aria-label="Basic information" className="space-y-4">
          <h3 className="text-sm font-extrabold">Basic Information</h3>
          <Field form={form} name="fullName" label="Full name" required />
          <Field form={form} name="phone" label="Phone number" />
          <Field form={form} name="email" label="Email address" type="email" />
          <Field form={form} name="dateOfBirth" label="Date of birth" type="date" />
        </section>
        <section aria-label="Location and profile" className="space-y-4">
          <h3 className="text-sm font-extrabold">Location & Profile</h3>
          <Field form={form} name="nationality" label="Nationality" />
          <Field form={form} name="city" label="City" />
          <Controller control={form.control} name="address" render={({ field, fieldState }) => (
            <TextField name="address" isInvalid={Boolean(fieldState.error)} value={field.value} onChange={field.onChange}><Label>Address</Label><TextArea rows={3} /><FieldError>{fieldState.error?.message}</FieldError></TextField>
          )} />
        </section>
        <p className="text-xs text-[var(--admin-muted)]">Empty fields are left unchanged. Sign-in identity, role and history can’t be edited here.</p>
      </Drawer.Body>
      <Drawer.Footer className="grid grid-cols-2 gap-2">
        <Button type="button" variant="tertiary" className="min-h-11" onPress={onClose}>Cancel</Button>
        <Button type="submit" variant="primary" className="min-h-11" isPending={form.formState.isSubmitting}>Save Changes</Button>
      </Drawer.Footer>
    </Form>
  );
}

export function CustomerEditDrawer({ customer, isOpen, onOpenChange }: { customer: Customer; isOpen: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay">
      <Drawer.Content placement="right" className="w-full max-w-md">
        <Drawer.Dialog aria-label="Edit customer">
          <Drawer.CloseTrigger />
          <EditForm key={customer.id} customer={customer} onClose={() => onOpenChange(false)} />
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
