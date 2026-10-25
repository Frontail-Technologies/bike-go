"use client";

import { Button } from "@heroui/react";
import { ImageIcon, PlusIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";
import {
  AdminPagination,
  AdminSearch,
  AdminSelect,
} from "@/components/admin/controls";
import { AdminStatusBadge } from "@/components/admin/data-display/status-badge";
import {
  AdminErrorState,
  ConfirmationDialog,
} from "@/components/admin/feedback";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/error";
import { cn } from "@/lib/cn";
import {
  useMasterDataMutations,
  useMasterDataQuery,
} from "../hooks/use-master-data";
import type {
  MasterItem,
  MasterKind,
  MasterPageParams,
} from "../types/master-data";
import { deactivateCopy, ItemRowActions } from "./item-row-actions";
import { MasterDataDialog, type MasterDataSubmit } from "./master-data-dialog";

type MasterDataSectionProps = {
  kind: MasterKind;
  title: string;
  description: string;
  noun: string;
  reorder?: boolean;
  withImage?: boolean;
};

const PAGE_SIZE = 20;
const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const failure = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : "Something went wrong. Try again.";

export function MasterDataSection({
  kind,
  title,
  description,
  noun,
  reorder = false,
  withImage = false,
}: MasterDataSectionProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<MasterItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deactivating, setDeactivating] = useState<MasterItem | null>(null);
  const [deleting, setDeleting] = useState<MasterItem | null>(null);

  const params: MasterPageParams = {
    page,
    pageSize: PAGE_SIZE,
    search: search.trim() || undefined,
    active: status === "all" ? undefined : status === "active",
    sortBy: "sortOrder",
    sortOrder: "asc",
  };
  const query = useMasterDataQuery(kind, params);
  const mutations = useMasterDataMutations(kind);
  const items = query.data?.data ?? [];
  const meta = query.data?.meta;
  const filtered = Boolean(params.search) || params.active !== undefined;
  const canReorder =
    reorder &&
    !filtered &&
    page === 1 &&
    (meta?.total ?? 0) > 1 &&
    (meta?.total ?? 0) <= PAGE_SIZE;

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (item: MasterItem) => {
    setEditing(item);
    setDialogOpen(true);
  };

  async function save({ values, image, removeImage }: MasterDataSubmit) {
    const code = values.code.trim();
    const saved = editing
      ? await mutations.update.mutateAsync({
          id: editing.id,
          name: values.name,
          active: values.active,
          ...(code && code !== editing.code ? { code } : {}),
        })
      : await mutations.create.mutateAsync({
          name: values.name,
          active: values.active,
          ...(code ? { code } : {}),
        });
    if (withImage && image)
      await mutations.setImage.mutateAsync({ id: saved.id, image });
    else if (withImage && removeImage && editing?.imageUrl)
      await mutations.removeImage.mutateAsync(saved.id);
    toast.success(editing ? `${saved.name} updated` : `${saved.name} added`);
  }

  function setActive(item: MasterItem, active: boolean, onSettled?: () => void) {
    mutations.update.mutate(
      { id: item.id, active },
      {
        onSuccess: () => {
          toast.success(`${item.name} ${active ? "activated" : "deactivated"}`);
          onSettled?.();
        },
        onError: (error) => toast.danger(failure(error)),
      },
    );
  }

  function remove(item: MasterItem, onSettled?: () => void) {
    mutations.remove.mutate(item.id, {
      onSuccess: () => {
        toast.success(`${item.name} deleted`);
        onSettled?.();
      },
      onError: (error) => toast.danger(failure(error)),
    });
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const ids = items.map((item) => item.id);
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    mutations.reorder.mutate(ids, {
      onError: (error) => toast.danger(failure(error)),
    });
  }

  return (
    <section aria-label={title} className="adminSurface rounded-2xl">
      <header className="flex flex-wrap items-center gap-3 border-b border-[var(--admin-border)] p-4 sm:p-5">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-extrabold leading-tight">
            {title}{" "}
            {meta ? (
              <span className="ml-1 text-xs font-semibold text-[var(--admin-muted)]">
                {meta.total}
              </span>
            ) : null}
          </h2>
          <p className="text-sm text-[var(--admin-muted)]">{description}</p>
        </div>
        <Button variant="primary" className="min-h-11" onPress={openAdd}>
          <PlusIcon />
          Add {noun}
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--admin-border)] p-3 sm:px-5">
        <AdminSearch
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder={`Search ${title.toLowerCase()}…`}
          className="w-full flex-1 sm:max-w-xs"
        />
        <AdminSelect
          label="All statuses"
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          options={statusOptions}
          icon={null}
          className="w-full sm:w-44"
        />
      </div>

      {query.isError ? (
        <AdminErrorState
          title={`Couldn’t load ${title.toLowerCase()}`}
          description={failure(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : query.isLoading ? (
        <ul
          aria-label={`Loading ${title.toLowerCase()}`}
          aria-busy="true"
          className="divide-y divide-[var(--admin-border)]"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <li
              key={index}
              className="flex items-center gap-3 px-4 py-4 sm:px-5"
            >
              <span className="h-4 w-40 animate-pulse rounded bg-[var(--admin-surface-muted)]" />
              <span className="ml-auto h-6 w-16 animate-pulse rounded-full bg-[var(--admin-surface-muted)]" />
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-[var(--admin-muted)]">
          {filtered
            ? `No ${title.toLowerCase()} match these filters.`
            : `No ${title.toLowerCase()} yet. Add the first one.`}
        </p>
      ) : (
        <ul
          aria-label={title}
          className={cn(
            "divide-y divide-[var(--admin-border)]",
            query.isFetching && "opacity-70 transition-opacity",
          )}
        >
          {items.map((item, index) => (
            <li
              key={item.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3 sm:px-5",
                !item.active && "bg-[var(--admin-surface-muted)]/60",
              )}
            >
              {withImage ? (
                <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] text-[var(--admin-muted)]">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <ImageIcon size={20} weight="duotone" aria-hidden />
                  )}
                </span>
              ) : null}
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "truncate text-sm font-bold",
                    !item.active && "text-[var(--admin-muted)]",
                  )}
                >
                  {item.name}
                </p>
                <p className="truncate text-xs text-[var(--admin-muted)]">
                  {item.code}
                </p>
              </div>
              <AdminStatusBadge status={item.active ? "active" : "inactive"} />
              <ItemRowActions
                name={item.name}
                active={item.active}
                onEdit={() => openEdit(item)}
                onToggle={() =>
                  item.active ? setDeactivating(item) : setActive(item, true)
                }
                onMoveUp={
                  canReorder && index > 0 ? () => move(index, -1) : undefined
                }
                onMoveDown={
                  canReorder && index < items.length - 1
                    ? () => move(index, 1)
                    : undefined
                }
                onDelete={() => setDeleting(item)}
              />
            </li>
          ))}
        </ul>
      )}

      {meta && meta.totalPages > 1 ? (
        <div className="border-t border-[var(--admin-border)]">
          <AdminPagination
            page={meta.page}
            pageCount={meta.totalPages}
            total={meta.total}
            pageSize={meta.pageSize}
            onPageChange={setPage}
          />
        </div>
      ) : null}

      <MasterDataDialog
        open={dialogOpen}
        noun={noun}
        item={editing}
        withImage={withImage}
        onClose={() => setDialogOpen(false)}
        onSubmit={save}
      />
      <ConfirmationDialog
        isOpen={Boolean(deactivating)}
        onOpenChange={(open) => !open && setDeactivating(null)}
        title={`Deactivate ${deactivating?.name ?? noun}?`}
        description={deactivateCopy(deactivating?.name ?? "This item")}
        confirmLabel="Deactivate"
        danger
        isPending={mutations.update.isPending}
        onConfirm={() => {
          // Close only once the mutation settles, so the dialog can't be dismissed mid-request or submitted twice.
          if (deactivating) setActive(deactivating, false, () => setDeactivating(null));
        }}
      />
      <ConfirmationDialog
        isOpen={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name ?? noun}?`}
        description={`This cannot be undone. Vehicles or loans that already used “${deleting?.name ?? "this item"}” keep that text; only new selections are affected.`}
        confirmLabel="Delete"
        danger
        isPending={mutations.remove.isPending}
        onConfirm={() => {
          if (deleting) remove(deleting, () => setDeleting(null));
        }}
      />
    </section>
  );
}
