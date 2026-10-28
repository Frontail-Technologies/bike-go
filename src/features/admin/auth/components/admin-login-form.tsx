"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Card, FieldError, Input, Label, TextField } from "@heroui/react";
import { AdminButton as Button } from "@/components/admin/controls";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import { ApiError } from "@/lib/api/error";
import { adminAuthApi } from "../api/admin-auth-api";
import { adminAuthQueryKeys } from "../query-keys";
import { adminLoginSchema } from "../schemas/auth-schemas";

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
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<Values>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", password: "" },
  });
  const mutation = useMutation({
    mutationFn: adminAuthApi.login,
    onSuccess: (session) => {
      queryClient.setQueryData(adminAuthQueryKeys.session(), session);
      router.replace(
        session.mustChangePassword
          ? "/admin/change-password"
          : requestedDestination(),
      );
    },
  });
  const message =
    mutation.error instanceof ApiError ? mutation.error.message : null;

  return (
    <Card className="w-full max-w-md p-6 shadow-xl">
      <Card.Header>
        <Card.Title>Admin sign in</Card.Title>
        <Card.Description>
          Use your RideGo administrator email and password.
        </Card.Description>
      </Card.Header>
      <form
        className="grid gap-4"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
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
              <Label>Email</Label>
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
              <Label>Password</Label>
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
          {mutation.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </Card>
  );
}
