"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Card, FieldError, Input, Label, TextField } from "@heroui/react";
import { AdminButton as Button } from "@/components/admin/controls";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import { ApiError } from "@/lib/api/error";
import { useAdminLogin } from "../hooks/use-admin-credentials";
import { adminLoginSchema } from "../schemas/auth-schemas";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

type Values = z.infer<typeof adminLoginSchema>;

const destination = (value: string | null) =>
  value?.startsWith("/admin/") &&
  !value.startsWith("//") &&
  !value.startsWith("/admin/login")
    ? value
    : "/admin";

function requestedDestination() {
  if (typeof window === "undefined") return "/admin";
  return destination(
    new URLSearchParams(window.location.search).get("returnTo"),
  );
}

export function AdminLoginForm() {
  const t = useAdminTranslations();
  const router = useRouter();
  const form = useForm<Values>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", password: "" },
  });
  const mutation = useAdminLogin();
  const signIn = (values: Values) =>
    mutation.mutate(values, {
      onSuccess: (session) => router.replace(session.mustChangePassword ? "/admin/change-password" : requestedDestination()),
    });
  const message =
    mutation.error instanceof ApiError ? mutation.error.message : null;

  return (
    <Card className="w-full max-w-md p-6 shadow-xl">
      <Card.Header>
        <Card.Title>{t("auth.title")}</Card.Title>
        <Card.Description>
          {t("auth.description")}
        </Card.Description>
      </Card.Header>
      <form
        className="grid gap-4"
        onSubmit={form.handleSubmit(signIn)}
      >
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <TextField
              isRequired
              isInvalid={Boolean(fieldState.error)}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              autoComplete="email"
            >
              <Label>{t("auth.email")}</Label>
              <Input />
              <FieldError>{fieldState.error?.message}</FieldError>
            </TextField>
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <TextField
              isRequired
              isInvalid={Boolean(fieldState.error)}
              type="password"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              autoComplete="current-password"
            >
              <Label>{t("auth.password")}</Label>
              <Input />
              <FieldError>{fieldState.error?.message}</FieldError>
            </TextField>
          )}
        />
        {message ? (
          <p role="alert" className="text-sm text-(--admin-danger)">
            {message}
          </p>
        ) : null}
        <Button
          type="submit"
          variant="primary"
          isPending={mutation.isPending}
          fullWidth
        >
          {mutation.isPending ? t("auth.signingIn") : t("auth.signIn")}
        </Button>
      </form>
    </Card>
  );
}
