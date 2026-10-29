"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Card, FieldError, Input, Label, TextField } from "@heroui/react";
import { AdminButton as Button } from "@/components/admin/controls";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { ApiError } from "@/lib/api/error";
import { useAdminChangePassword } from "@/features/admin/auth/hooks/use-admin-credentials";
import { adminPasswordSchema } from "@/features/admin/auth/schemas/auth-schemas";
import type { z } from "zod";
import { AdminLanguageSwitcher } from "@/features/admin/i18n/components/admin-language-switcher";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

type Values = z.infer<typeof adminPasswordSchema>;

export default function ChangePasswordPage() {
  const t = useAdminTranslations();
  const router = useRouter();
  const form = useForm<Values>({
    resolver: zodResolver(adminPasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const mutation = useAdminChangePassword();
  const message = mutation.error instanceof ApiError ? mutation.error.message : null;
  const labels: Record<keyof Values, string> = {
    currentPassword: t("auth.currentPassword"),
    newPassword: t("auth.newPassword"),
    confirmPassword: t("auth.confirmPassword"),
  };

  return (
    <main data-admin-ui className="relative flex min-h-dvh items-center justify-center bg-[var(--admin-workspace)] p-5">
      <div className="absolute right-5 top-5"><AdminLanguageSwitcher /></div>
      <Card className="w-full max-w-md p-6 shadow-sm sm:p-8">
        <Card.Header>
          <Card.Title>{t("auth.setPassword")}</Card.Title>
          <Card.Description>{t("auth.setPasswordDescription")}</Card.Description>
        </Card.Header>
        <form className="grid gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values, { onSuccess: () => router.replace("/admin") }))}>
          {(Object.keys(labels) as Array<keyof Values>).map((field) => (
            <Controller key={field} control={form.control} name={field} render={({ field: formField, fieldState }) => (
              <TextField isRequired isInvalid={Boolean(fieldState.error)} type="password" value={formField.value} onChange={formField.onChange} onBlur={formField.onBlur} autoComplete={field === "currentPassword" ? "current-password" : "new-password"}>
                <Label>{labels[field]}</Label>
                <Input />
                <FieldError>{fieldState.error?.message}</FieldError>
              </TextField>
            )} />
          ))}
          {message ? <p role="alert" className="text-sm text-[var(--admin-danger)]">{message}</p> : null}
          <Button type="submit" variant="primary" isPending={mutation.isPending} fullWidth>
            {mutation.isPending ? t("auth.savingPassword") : t("auth.changePassword")}
          </Button>
        </form>
      </Card>
    </main>
  );
}
