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

type Values = z.infer<typeof adminPasswordSchema>;

const labels: Record<keyof Values, string> = {
  currentPassword: "Current password",
  newPassword: "New password",
  confirmPassword: "Confirm new password",
};

export default function ChangePasswordPage() {
  const router = useRouter();
  const form = useForm<Values>({
    resolver: zodResolver(adminPasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const mutation = useAdminChangePassword();
  const message = mutation.error instanceof ApiError ? mutation.error.message : null;

  return (
    <main data-admin-ui className="flex min-h-dvh items-center justify-center bg-[var(--admin-workspace)] p-5">
      <Card className="w-full max-w-md p-6 shadow-sm sm:p-8">
        <Card.Header>
          <Card.Title>Set a new password</Card.Title>
          <Card.Description>Choose a new administrator password to continue to RideGo Admin.</Card.Description>
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
            {mutation.isPending ? "Saving password…" : "Change password"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
