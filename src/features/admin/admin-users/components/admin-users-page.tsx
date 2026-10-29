"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Description,
  Dropdown,
  FieldError,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Spinner,
  TextField,
} from "@heroui/react";
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
import { useAdminUsersListState } from "../hooks/use-admin-users-list-state";
import {
  adminUserSchema,
  editAdminUserSchema,
  resetAdminPasswordSchema,
} from "../schemas/admin-user-schemas";
import type { AdminUser, AdminUsersParams } from "../types/admin-user";
import type { z } from "zod";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

type CreateValues = z.infer<typeof adminUserSchema>;
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
  const t = useAdminTranslations();
  const session = useAdminSessionQuery();
  const listState = useAdminUsersListState();
  const { params, setFilters, setPage } = listState;
  const [search, setSearch] = useState(params.search ?? "");
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
      () => setFilters({ search: search || undefined }),
      300,
    );
    return () => clearTimeout(timer);
  }, [search, setFilters]);
  if (session.data?.role !== "super_admin")
    return (
      <AdminPage>
        <PageHeader
          title={t("pages.admins.title")}
          description={t("pages.admins.restricted")}
        />
      </AdminPage>
    );
  const columns: ColumnDef<AdminUser>[] = [
    {
      accessorKey: "name",
      header: t("admins.columns.admin"),
      cell: ({ row }) => <span className="font-bold">{row.original.name}</span>,
    },
    { accessorKey: "email", header: t("admins.columns.email") },
    {
      accessorKey: "role",
      header: t("admins.columns.role"),
      cell: ({ row }) =>
        t(`admins.roles.${row.original.role}`),
    },
    {
      accessorKey: "status",
      header: t("admins.columns.status"),
      cell: ({ row }) => <AdminStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "lastLoginAt",
      header: t("admins.columns.lastLogin"),
      cell: ({ row }) =>
        row.original.lastLoginAt
          ? formatCambodiaDate(row.original.lastLoginAt)
          : t("admins.never"),
    },
    {
      accessorKey: "createdAt",
      header: t("admins.columns.created"),
      cell: ({ row }) => formatCambodiaDate(row.original.createdAt),
    },
  ];
  const update = (next: Partial<AdminUsersParams>) => next.page ? setPage(next.page) : setFilters(next);
  const rows = query.data?.data ?? [];
  return (
    <AdminPage>
      <PageHeader
        title={t("pages.admins.title")}
        description={t("pages.admins.description")}
        actions={
          <Button
            variant="primary"
            onPress={() => {
              setSelected(null);
              setDialog("create");
            }}
          >
            <PlusIcon />
            {t("pages.admins.add")}
          </Button>
        }
      />
      <ContentSection>
        <FilterBar
          search={
            <AdminSearch
              value={search}
              onChange={setSearch}
              placeholder={t("pages.admins.search")}
            />
          }
        >
          <AdminSelect
            label={t("filters.allRoles")}
            value={params.role ?? ""}
            onChange={(role) =>
              update({ role: role ? (role as AdminUser["role"]) : undefined })
            }
            options={[
              { value: "", label: t("filters.allRoles") },
              { value: "admin", label: t("admins.roles.admin") },
              { value: "super_admin", label: t("admins.roles.super_admin") },
            ]}
          />
          <AdminSelect
            label={t("filters.allStatuses")}
            value={params.status ?? ""}
            onChange={(status) =>
              update({
                status: status ? (status as AdminUser["status"]) : undefined,
              })
            }
            options={[
              { value: "", label: t("filters.allStatuses") },
              { value: "active", label: t("admins.active") },
              { value: "inactive", label: t("admins.inactive") },
            ]}
          />
        </FilterBar>
        <AdminDataTable
          columns={columns}
          data={rows}
          label={t("admins.label")}
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
                aria-label={t("admins.actionsFor", { name: admin.name })}
              >
                <DotsThreeVerticalIcon />
              </Button>
              <Dropdown.Popover className="adminOverlay">
                <Dropdown.Menu aria-label={t("admins.actionsFor", { name: admin.name })}>
                  <Dropdown.Item
                    id="edit"
                    onAction={() => {
                      setSelected(admin);
                      setDialog("edit");
                    }}
                  >
                    <Label>{t("admins.edit")}</Label>
                  </Dropdown.Item>
                  <Dropdown.Item
                    id="reset"
                    onAction={() => {
                      setSelected(admin);
                      setDialog("reset");
                    }}
                  >
                    <Label>{t("admins.resetPassword")}</Label>
                  </Dropdown.Item>
                  <Dropdown.Item
                    id="status"
                    variant={admin.status === "active" ? "danger" : "default"}
                    onAction={() => setConfirm(admin)}
                  >
                    <Label>
                      {admin.status === "active" ? t("actions.deactivate") : t("actions.activate")}
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
            ? t("admins.deactivateTitle")
            : t("admins.activateTitle")
        }
        description={t("admins.deactivateDescription")}
        confirmLabel={confirm?.status === "active" ? t("actions.deactivate") : t("actions.activate")}
        danger={confirm?.status === "active"}
        isPending={
          confirm?.status === "active"
            ? actions.deactivate.isPending
            : actions.activate.isPending
        }
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
  const t = useAdminTranslations();
  const schema = (
    dialog === "edit"
      ? editAdminUserSchema
      : dialog === "reset"
        ? resetAdminPasswordSchema
        : adminUserSchema
  ) as typeof adminUserSchema;
  const form = useForm<CreateValues>({
    resolver: zodResolver(schema),
    defaultValues: selected
      ? {
          name: selected.name,
          email: selected.email,
          role: selected.role,
          password: "",
          confirmPassword: "",
        }
      : {
          name: "",
          email: "",
          role: "admin",
          password: "",
          confirmPassword: "",
        },
  });
  if (!dialog) return null;
  const submit = form.handleSubmit((v) => {
    if (dialog === "create")
      create.mutate(
        { name: v.name, email: v.email, role: v.role, password: v.password },
        { onSuccess: close },
      );
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
          ? t("admins.form.add")
          : dialog === "edit"
            ? t("admins.form.edit")
            : t("admins.form.reset")
      }
      open
      onOpenChange={(o) => !o && close()}
    >
      <form onSubmit={submit} className="contents">
        <Modal.Body className="grid gap-4">
          {dialog !== "reset" ? (
            <>
              <Controller
                control={control}
                name="name"
                render={({ field, fieldState }) => (
                  <TextField
                    isRequired
                    isInvalid={Boolean(fieldState.error)}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    autoFocus
                  >
                    <Label>{t("admins.form.fullName")}</Label>
                    <Input />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </TextField>
                )}
              />
              {dialog === "create" ? (
                <Controller
                  control={control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <TextField
                      isRequired
                      isInvalid={Boolean(fieldState.error)}
                      type="email"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    >
                      <Label>{t("admins.form.email")}</Label>
                      <Input />
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </TextField>
                  )}
                />
              ) : (
                <TextField isDisabled value={selected?.email ?? ""}>
                  <Label>{t("admins.form.email")}</Label>
                  <Input />
                  <Description>
                    {t("admins.form.emailLocked")}
                  </Description>
                </TextField>
              )}
              <Controller
                control={control}
                name="role"
                render={({ field, fieldState }) => (
                  <Select
                    placeholder={t("admins.form.selectRole")}
                    value={field.value ?? null}
                    onChange={(key) =>
                      key !== null && field.onChange(String(key))
                    }
                    isInvalid={Boolean(fieldState.error)}
                  >
                    <Label>{t("admins.form.role")}</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="adminOverlay">
                      <ListBox>
                        <ListBox.Item id="admin" textValue={t("admins.roles.admin")}>
                          {t("admins.roles.admin")}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                        <ListBox.Item id="super_admin" textValue={t("admins.roles.super_admin")}>
                          {t("admins.roles.super_admin")}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      </ListBox>
                    </Select.Popover>
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </Select>
                )}
              />
            </>
          ) : null}
          {dialog !== "edit" ? (
            <>
              <Controller
                control={control}
                name="password"
                render={({ field, fieldState }) => (
                  <TextField
                    isRequired
                    isInvalid={Boolean(fieldState.error)}
                    type="password"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    autoFocus={dialog === "reset"}
                  >
                    <Label>
                      {dialog === "reset"
                        ? t("admins.form.temporaryPassword")
                        : t("admins.form.initialPassword")}
                    </Label>
                    <Input />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </TextField>
                )}
              />
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field, fieldState }) => (
                  <TextField
                    isRequired
                    isInvalid={Boolean(fieldState.error)}
                    type="password"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  >
                    <Label>{t("admins.form.confirmPassword")}</Label>
                    <Input />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </TextField>
                )}
              />
            </>
          ) : null}
          {error ? (
            <p role="alert" className="text-sm text-(--admin-danger)">
              {error.message}
            </p>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="tertiary" onPress={close}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            variant="primary"
            isPending={create.isPending || update.isPending || reset.isPending}
          >
            {create.isPending || update.isPending || reset.isPending ? (
              <Spinner color="current" size="sm" />
            ) : null}
            {dialog === "create"
              ? t("admins.form.add")
              : dialog === "edit"
                ? t("admins.form.save")
                : t("admins.form.reset")}
          </Button>
        </Modal.Footer>
      </form>
    </ModalFrame>
  );
}
