"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Description, Dropdown, FieldError, Input, Label, ListBox, Modal, Select, TextField } from "@heroui/react";
import { DotsThreeVerticalIcon, PlusIcon } from "@phosphor-icons/react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  AdminSearch,
  AdminSelect,
  FilterBar,
  formatCambodiaDate,
} from "@/components/admin/controls";
import { AdminDataTable } from "@/components/admin/data-display/admin-data-table";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import { ConfirmationDialog } from "@/components/admin/feedback";
import {
  AdminPage,
  ContentSection,
  PageHeader,
} from "@/components/admin/layout";
import { ApiError } from "@/lib/api/error";
import { useAdminSessionQuery } from "@/features/admin/auth/hooks/use-admin-session-query";
import {
  useAdminUserMutations,
  useAdminUsersQuery,
} from "../hooks/use-admin-users";
import {
  adminUserSchema,
  editAdminUserSchema,
  resetAdminPasswordSchema,
} from "../schemas/admin-user-schemas";
import type { AdminUser, AdminUsersParams } from "../types/admin-user";
import type { z } from "zod";

type CreateValues = z.infer<typeof adminUserSchema>;
const initial: AdminUsersParams = {
  page: 1,
  pageSize: 20,
  sortBy: "createdAt",
  sortOrder: "desc",
};
function sync(params: AdminUsersParams) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && !(key === "page" && value === 1))
      query.set(key, String(value));
  });
  history.replaceState(
    null,
    "",
    `/admin/admins${query.size ? `?${query}` : ""}`,
  );
}
function ModalFrame({
  title,
  children,
  open,
  onOpenChange,
}: {
  title: string;
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Modal.Backdrop
      isOpen={open}
      onOpenChange={onOpenChange}
      className="adminOverlay"
    >
      <Modal.Container size="md">
        <Modal.Dialog aria-label={title}>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>{title}</Modal.Heading>
          </Modal.Header>
          {children}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
export function AdminUsersPage() {
  const session = useAdminSessionQuery();
  const [params, setParams] = useState<AdminUsersParams>(initial);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<"create" | "edit" | "reset" | null>(
    null,
  );
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [confirm, setConfirm] = useState<AdminUser | null>(null);
  const query = useAdminUsersQuery(params);
  const actions = useAdminUserMutations();
  const sorting: SortingState = params.sortBy
    ? [{ id: params.sortBy, desc: params.sortOrder === "desc" }]
    : [];
  useEffect(() => {
    const timer = setTimeout(
      () => setParams((p) => ({ ...p, page: 1, search: search || undefined })),
      300,
    );
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => sync(params), [params]);
  if (session.data?.role !== "super_admin")
    return (
      <AdminPage>
        <PageHeader
          title="Admin Users"
          description="Only super administrators can manage administrator accounts."
        />
      </AdminPage>
    );
  const columns: ColumnDef<AdminUser>[] = [
    {
      accessorKey: "name",
      header: "Admin",
      cell: ({ row }) => <span className="font-bold">{row.original.name}</span>,
    },
    { accessorKey: "email", header: "Email" },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) =>
        row.original.role === "super_admin" ? "Super admin" : "Admin",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <AdminStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "lastLoginAt",
      header: "Last login",
      cell: ({ row }) =>
        row.original.lastLoginAt
          ? formatCambodiaDate(row.original.lastLoginAt)
          : "Never",
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => formatCambodiaDate(row.original.createdAt),
    },
  ];
  const update = (next: Partial<AdminUsersParams>) =>
    setParams((p) => ({ ...p, ...next, page: next.page ?? 1 }));
  const rows = query.data?.data ?? [];
  return (
    <AdminPage>
      <PageHeader
        title="Admin Users"
        description="Manage secure RideGo administrator access."
        actions={
          <Button
            variant="primary"
            onPress={() => {
              setSelected(null);
              setDialog("create");
            }}
          >
            <PlusIcon />
            Add Admin
          </Button>
        }
      />
      <ContentSection>
        <FilterBar
          search={
            <AdminSearch
              value={search}
              onChange={setSearch}
              placeholder="Search administrators…"
            />
          }
        >
          <AdminSelect
            label="All roles"
            value={params.role ?? ""}
            onChange={(role) =>
              update({ role: role ? (role as AdminUser["role"]) : undefined })
            }
            options={[
              { value: "", label: "All roles" },
              { value: "admin", label: "Admin" },
              { value: "super_admin", label: "Super admin" },
            ]}
          />
          <AdminSelect
            label="All statuses"
            value={params.status ?? ""}
            onChange={(status) =>
              update({
                status: status ? (status as AdminUser["status"]) : undefined,
              })
            }
            options={[
              { value: "", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
        </FilterBar>
        <AdminDataTable
          columns={columns}
          data={rows}
          label="Administrator users"
          loading={query.isLoading}
          manualSorting
          sorting={sorting}
          onSortingChange={(next) => {
            const value = typeof next === "function" ? next(sorting) : next;
            const first = value[0];
            update({
              sortBy: first?.id as AdminUsersParams["sortBy"],
              sortOrder: first?.desc ? "desc" : "asc",
            });
          }}
          pagination={{
            page: params.page,
            pageSize: params.pageSize,
            total: query.data?.meta.total ?? 0,
            onPageChange: (page) => update({ page }),
          }}
          rowActions={(admin) => (
            <Dropdown>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label={`Actions for ${admin.name}`}
              >
                <DotsThreeVerticalIcon />
              </Button>
              <Dropdown.Popover className="adminOverlay">
                <Dropdown.Menu aria-label={`Actions for ${admin.name}`}>
                  <Dropdown.Item
                    id="edit"
                    onAction={() => {
                      setSelected(admin);
                      setDialog("edit");
                    }}
                  >
                    <Label>Edit</Label>
                  </Dropdown.Item>
                  <Dropdown.Item
                    id="reset"
                    onAction={() => {
                      setSelected(admin);
                      setDialog("reset");
                    }}
                  >
                    <Label>Reset password</Label>
                  </Dropdown.Item>
                  <Dropdown.Item
                    id="status"
                    variant={admin.status === "active" ? "danger" : "default"}
                    onAction={() => setConfirm(admin)}
                  >
                    <Label>
                      {admin.status === "active" ? "Deactivate" : "Activate"}
                    </Label>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          )}
        />
      </ContentSection>
      <AdminForm
        key={dialog ?? "closed"}
        dialog={dialog}
        selected={selected}
        close={() => setDialog(null)}
        create={actions.create}
        update={actions.update}
        reset={actions.reset}
      />
      <ConfirmationDialog
        isOpen={Boolean(confirm)}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={
          confirm?.status === "active"
            ? "Deactivate administrator?"
            : "Activate administrator?"
        }
        description="Deactivation immediately revokes every active administrator session."
        confirmLabel={confirm?.status === "active" ? "Deactivate" : "Activate"}
        danger={confirm?.status === "active"}
        isPending={confirm?.status === "active" ? actions.deactivate.isPending : actions.activate.isPending}
        onConfirm={() => {
          if (!confirm) return;
          (confirm.status === "active"
            ? actions.deactivate
            : actions.activate
          ).mutate(confirm.id, { onSuccess: () => setConfirm(null) });
        }}
      />
    </AdminPage>
  );
}
function AdminForm({
  dialog,
  selected,
  close,
  create,
  update,
  reset,
}: {
  dialog: "create" | "edit" | "reset" | null;
  selected: AdminUser | null;
  close: () => void;
  create: ReturnType<typeof useAdminUserMutations>["create"];
  update: ReturnType<typeof useAdminUserMutations>["update"];
  reset: ReturnType<typeof useAdminUserMutations>["reset"];
}) {
  // Each dialog validates only the fields it shows; the schemas are subsets of the same field set, so this cast is safe.
  const schema = (dialog === "edit" ? editAdminUserSchema : dialog === "reset" ? resetAdminPasswordSchema : adminUserSchema) as typeof adminUserSchema;
  const form = useForm<CreateValues>({
    resolver: zodResolver(schema),
    defaultValues: selected
      ? { name: selected.name, email: selected.email, role: selected.role, password: "", confirmPassword: "" }
      : { name: "", email: "", role: "admin", password: "", confirmPassword: "" },
  });
  if (!dialog) return null;
  const submit = form.handleSubmit((v) => {
    if (dialog === "create") create.mutate({ name: v.name, email: v.email, role: v.role, password: v.password }, { onSuccess: close });
    if (dialog === "edit" && selected)
      update.mutate(
        { id: selected.id, name: v.name, role: v.role },
        { onSuccess: close },
      );
    if (dialog === "reset" && selected)
      reset.mutate(
        { id: selected.id, password: v.password },
        { onSuccess: close },
      );
  });
  const error = [create.error, update.error, reset.error].find(
    (e) => e instanceof ApiError,
  ) as ApiError | undefined;
  const control = form.control;
  return (
    <ModalFrame
      title={
        dialog === "create"
          ? "Add Admin"
          : dialog === "edit"
            ? "Edit Admin"
            : "Reset Password"
      }
      open
      onOpenChange={(o) => !o && close()}
    >
      <form onSubmit={submit} className="contents">
        <Modal.Body className="grid gap-4">
          {dialog !== "reset" ? (
            <>
              <Controller control={control} name="name" render={({ field, fieldState }) => (
                <TextField isRequired isInvalid={Boolean(fieldState.error)} value={field.value} onChange={field.onChange} onBlur={field.onBlur} autoFocus>
                  <Label>Full name</Label>
                  <Input />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </TextField>
              )} />
              {dialog === "create" ? (
                <Controller control={control} name="email" render={({ field, fieldState }) => (
                  <TextField isRequired isInvalid={Boolean(fieldState.error)} type="email" value={field.value} onChange={field.onChange} onBlur={field.onBlur}>
                    <Label>Email</Label>
                    <Input />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </TextField>
                )} />
              ) : (
                <TextField isDisabled value={selected?.email ?? ""}>
                  <Label>Email</Label>
                  <Input />
                  <Description>The sign-in email can’t be changed here.</Description>
                </TextField>
              )}
              <Controller control={control} name="role" render={({ field, fieldState }) => (
                <Select placeholder="Select role" value={field.value ?? null} onChange={(key) => key !== null && field.onChange(String(key))} isInvalid={Boolean(fieldState.error)}>
                  <Label>Role</Label>
                  <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                  <Select.Popover className="adminOverlay">
                    <ListBox>
                      <ListBox.Item id="admin" textValue="Admin">Admin<ListBox.ItemIndicator /></ListBox.Item>
                      <ListBox.Item id="super_admin" textValue="Super admin">Super admin<ListBox.ItemIndicator /></ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Select>
              )} />
            </>
          ) : null}
          {dialog !== "edit" ? (
            <>
              <Controller control={control} name="password" render={({ field, fieldState }) => (
                <TextField isRequired isInvalid={Boolean(fieldState.error)} type="password" value={field.value} onChange={field.onChange} onBlur={field.onBlur} autoFocus={dialog === "reset"}>
                  <Label>{dialog === "reset" ? "Temporary password" : "Initial password"}</Label>
                  <Input />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </TextField>
              )} />
              <Controller control={control} name="confirmPassword" render={({ field, fieldState }) => (
                <TextField isRequired isInvalid={Boolean(fieldState.error)} type="password" value={field.value} onChange={field.onChange} onBlur={field.onBlur}>
                  <Label>Confirm password</Label>
                  <Input />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </TextField>
              )} />
            </>
          ) : null}
          {error ? (
            <p role="alert" className="text-sm text-[var(--admin-danger)]">
              {error.message}
            </p>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="tertiary" onPress={close}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isPending={create.isPending || update.isPending || reset.isPending}
          >
            {dialog === "create"
              ? "Add Admin"
              : dialog === "edit"
                ? "Save Changes"
                : "Reset Password"}
          </Button>
        </Modal.Footer>
      </form>
    </ModalFrame>
  );
}
