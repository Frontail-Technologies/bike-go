"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Drawer, FieldError, Form, Input, Label, TextArea, TextField } from "@heroui/react";
import { useState } from "react";
import { Controller, useForm, type FieldPath } from "react-hook-form";
import { AdminButton as Button } from "@/components/admin/controls";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/error";
import { useCustomerMutations } from "../hooks/use-customers";
import { customerToFormValues, formValuesToInput } from "../lib/customer-model";
import { customerEditSchema, type CustomerEditValues } from "../schemas/customer-schemas";
import type { Customer } from "../types/customer";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

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
  const t = useAdminTranslations();
  const mutations = useCustomerMutations();
  const [error, setError] = useState("");
  const form = useForm<CustomerEditValues>({ resolver: zodResolver(customerEditSchema), defaultValues: customerToFormValues(customer) });

  const submit = form.handleSubmit(async (values) => {
    setError("");
    try {
      const saved = await mutations.update.mutateAsync({ id: customer.id, ...formValuesToInput(values) });
      toast.success(t("customers.edit.updated", { name: saved.name }));
      onClose();
    } catch (failure) {
      if (failure instanceof ApiError) {
        let matched = false;
        for (const item of failure.fieldErrors) {
          const key = item.path === "fullName" || item.path === "phone" || item.path === "email" || item.path === "dateOfBirth" || item.path === "nationality" || item.path === "city" || item.path === "address" ? item.path : undefined;
          if (key) { form.setError(key, { message: item.message }); matched = true; }
        }
        setError(matched ? t("common.checkFields") : failure.message);
      } else setError(t("common.genericError"));
    }
  });

  return (
    <Form onSubmit={submit} className="contents">
      <Drawer.Header><Drawer.Heading>{t("customers.edit.title")}</Drawer.Heading></Drawer.Header>
      <Drawer.Body className="space-y-6">
        {error ? <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>{t("customers.edit.notSaved")}</Alert.Title><Alert.Description>{error}</Alert.Description></Alert.Content></Alert> : null}
        <section aria-label={t("customers.edit.basicLabel")} className="space-y-4">
          <h3 className="text-sm font-extrabold">{t("customers.edit.basic")}</h3>
          <Field form={form} name="fullName" label={t("customers.edit.fullName")} required />
          <Field form={form} name="phone" label={t("customers.edit.phone")} />
          <Field form={form} name="email" label={t("customers.edit.email")} type="email" />
          <Field form={form} name="dateOfBirth" label={t("customers.edit.dob")} type="date" />
        </section>
        <section aria-label={t("customers.edit.locationLabel")} className="space-y-4">
          <h3 className="text-sm font-extrabold">{t("customers.edit.location")}</h3>
          <Field form={form} name="nationality" label={t("customers.edit.nationality")} />
          <Field form={form} name="city" label={t("customers.edit.city")} />
          <Controller control={form.control} name="address" render={({ field, fieldState }) => (
            <TextField name="address" isInvalid={Boolean(fieldState.error)} value={field.value} onChange={field.onChange}><Label>{t("customers.edit.address")}</Label><TextArea rows={3} /><FieldError>{fieldState.error?.message}</FieldError></TextField>
          )} />
        </section>
        <p className="text-xs text-[var(--admin-muted)]">{t("customers.edit.hint")}</p>
      </Drawer.Body>
      <Drawer.Footer className="grid grid-cols-2 gap-2">
        <Button type="button" variant="tertiary" className="min-h-11" onPress={onClose}>{t("common.cancel")}</Button>
        <Button type="submit" variant="primary" className="min-h-11" isPending={form.formState.isSubmitting}>{t("customers.edit.save")}</Button>
      </Drawer.Footer>
    </Form>
  );
}

export function CustomerEditDrawer({ customer, isOpen, onOpenChange }: { customer: Customer | null; isOpen: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useAdminTranslations();
  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay">
      <Drawer.Content placement="right" className="w-full max-w-md">
        <Drawer.Dialog aria-label={t("customers.edit.title")}>
          <Drawer.CloseTrigger />
          {customer ? <EditForm key={customer.id} customer={customer} onClose={() => onOpenChange(false)} /> : null}
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
