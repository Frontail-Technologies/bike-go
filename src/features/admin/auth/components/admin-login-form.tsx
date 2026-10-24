"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { ApiError } from "@/lib/api/error";
import { adminAuthApi } from "../api/admin-auth-api";
import { adminAuthQueryKeys } from "../query-keys";
import { adminLoginSchema } from "../schemas/auth-schemas";

type Values = z.infer<typeof adminLoginSchema>;

const destination = (value: string | null) =>
  value?.startsWith("/admin/") && !value.startsWith("//") && !value.startsWith("/admin/login")
    ? value
    : "/admin";

function requestedDestination() {
  if (typeof window === "undefined") return "/admin";
  return destination(new URLSearchParams(window.location.search).get("returnTo"));
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
      router.replace(session.mustChangePassword ? "/admin/change-password" : requestedDestination());
    },
  });
  const message = mutation.error instanceof ApiError ? mutation.error.message : null;

  return (
    <Card className="w-full max-w-md p-6 shadow-xl">
      <Card.Header>
        <Card.Title>Admin sign in</Card.Title>
        <Card.Description>Use your RideGo administrator email and password.</Card.Description>
      </Card.Header>
      <form className="grid gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <label className="grid gap-1 text-sm font-semibold">
          Email
          <input
            className="h-11 rounded-xl border border-[var(--admin-border)] px-3"
            autoComplete="email"
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register("email")}
          />
        </label>
        {form.formState.errors.email ? <p role="alert" className="text-sm text-[var(--admin-danger)]">{form.formState.errors.email.message}</p> : null}
        <label className="grid gap-1 text-sm font-semibold">
          Password
          <input
            className="h-11 rounded-xl border border-[var(--admin-border)] px-3"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register("password")}
          />
        </label>
        {form.formState.errors.password ? <p role="alert" className="text-sm text-[var(--admin-danger)]">{form.formState.errors.password.message}</p> : null}
        {message ? <p role="alert" className="text-sm text-[var(--admin-danger)]">{message}</p> : null}
        <Button type="submit" variant="primary" isPending={mutation.isPending} fullWidth>
          {mutation.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </Card>
  );
}
