"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ApiError } from "@/lib/api/error";
import { adminAuthApi } from "@/features/admin/auth/api/admin-auth-api";
import { adminAuthQueryKeys } from "@/features/admin/auth/query-keys";
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
  const queryClient = useQueryClient();
  const form = useForm<Values>({
    resolver: zodResolver(adminPasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const mutation = useMutation({
    mutationFn: adminAuthApi.changePassword,
    onSuccess: (session) => {
      queryClient.setQueryData(adminAuthQueryKeys.session(), session);
      router.replace("/admin");
    },
  });
  const message = mutation.error instanceof ApiError ? mutation.error.message : null;

  return (
    <main data-admin-ui className="flex min-h-dvh items-center justify-center bg-[var(--admin-workspace)] p-5">
      <Card className="w-full max-w-md p-6 shadow-sm sm:p-8">
        <Card.Header>
          <Card.Title>Set a new password</Card.Title>
          <Card.Description>Choose a new administrator password to continue to RideGo Admin.</Card.Description>
        </Card.Header>
        <form className="grid gap-4" onSubmit={form.handleSubmit(({ confirmPassword: _confirmPassword, ...input }) => mutation.mutate(input))}>
          {(Object.keys(labels) as Array<keyof Values>).map((field) => (
            <label key={field} className="grid gap-1.5 text-sm font-semibold">
              {labels[field]}
              <input
                className="h-11 rounded-xl border border-[var(--admin-border)] bg-white px-3 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--admin-accent-strong)]"
                type="password"
                autoComplete={field === "currentPassword" ? "current-password" : "new-password"}
                aria-invalid={Boolean(form.formState.errors[field])}
                {...form.register(field)}
              />
              {form.formState.errors[field] ? <span role="alert" className="text-sm font-normal text-[var(--admin-danger)]">{form.formState.errors[field]?.message}</span> : null}
            </label>
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
