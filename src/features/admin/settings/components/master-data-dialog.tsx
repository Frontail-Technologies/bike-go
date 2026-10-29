"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Description, FieldError, Input, Label, Modal, Spinner, TextField } from "@heroui/react";
import { ArrowsClockwiseIcon, TrashIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ImageUploader } from "@/components/admin/forms/image-uploader";
import { ApiError } from "@/lib/api/error";
import { masterDataSchema, type MasterDataValues } from "../schemas/master-data-schema";
import type { MasterItem } from "../types/master-data";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

export type MasterDataSubmit = { values: MasterDataValues; image: File | null; removeImage: boolean };

type MasterDataDialogProps = {
  noun: string;
  item: MasterItem | null;
  withImage: boolean;
  onClose: () => void;
  onSubmit: (submit: MasterDataSubmit) => Promise<void>;
};

function DialogForm({ noun, item, withImage, onClose, onSubmit }: MasterDataDialogProps) {
  const t = useAdminTranslations();
  const [image, setImage] = useState<File | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [removeImage, setRemoveImage] = useState(false);
  const [error, setError] = useState("");
  const form = useForm<MasterDataValues>({ resolver: zodResolver(masterDataSchema), defaultValues: { name: item?.name ?? "", code: item?.code ?? "", active: item?.active ?? true } });
  const existingImage = item?.imageUrl && !removeImage && !replacing ? item.imageUrl : null;

  const submit = form.handleSubmit(async (values) => {
    setError("");
    try {
      await onSubmit({ values, image, removeImage });
      onClose();
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : t("settings.dialog.saveError"));
    }
  });

  return (
    <form onSubmit={submit} noValidate className="contents">
      <Modal.Body className="space-y-4">
        {error ? (
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{t("settings.dialog.notSaved")}</Alert.Title>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <TextField isRequired isInvalid={Boolean(fieldState.error)} value={field.value} onChange={field.onChange} autoFocus>
              <Label>{t("settings.dialog.name")}</Label>
              <Input />
              <FieldError>{fieldState.error?.message}</FieldError>
            </TextField>
          )}
        />
        <Controller
          control={form.control}
          name="code"
          render={({ field, fieldState }) => (
            <TextField isInvalid={Boolean(fieldState.error)} value={field.value} onChange={field.onChange}>
              <Label>{t("settings.dialog.code")}</Label>
              <Input placeholder={t("settings.dialog.codePlaceholder")} />
              <Description>{t("settings.dialog.codeHint")}</Description>
              <FieldError>{fieldState.error?.message}</FieldError>
            </TextField>
          )}
        />
        {withImage ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("settings.dialog.image")}</p>
            {existingImage ? (
              <div className="space-y-2">
                <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]">
                  <Image src={existingImage} alt={item?.name ?? t("settings.dialog.categoryImage")} fill unoptimized className="object-cover" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" className="min-h-11 md:min-h-9" onPress={() => setReplacing(true)}>
                    <ArrowsClockwiseIcon size={15} />
                    {t("settings.dialog.replaceImage")}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="min-h-11 text-[var(--admin-danger)] md:min-h-9" onPress={() => setRemoveImage(true)}>
                    <TrashIcon size={15} />
                    {t("settings.dialog.remove")}
                  </Button>
                </div>
              </div>
            ) : (
              <ImageUploader limit={1} maxSizeMb={5} aspectClass="aspect-[16/9]" emptyTitle={t("settings.dialog.upload", { noun })} emptyHint={t("settings.dialog.uploadHint")} onChange={(files) => setImage(files[0] ?? null)} />
            )}
          </div>
        ) : null}
        <Controller
          control={form.control}
          name="active"
          render={({ field }) => (
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-[var(--admin-border)] p-3 text-sm font-semibold focus-within:ring-2 focus-within:ring-[var(--admin-accent-strong)]">
              <input type="checkbox" checked={field.value} onChange={(event) => field.onChange(event.target.checked)} className="size-4 accent-[#dcae00]" />
              {t("settings.dialog.active")}
              <span className="text-xs font-normal text-[var(--admin-muted)]">{t("settings.dialog.activeHint")}</span>
            </label>
          )}
        />
      </Modal.Body>
      <Modal.Footer className="flex justify-end gap-2">
        <Button type="button" variant="tertiary" className="min-h-11" onPress={onClose}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" variant="primary" className="min-h-11" isPending={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Spinner aria-hidden="true" color="current" size="sm" /> : null}
          {t("settings.dialog.save")}
        </Button>
      </Modal.Footer>
    </form>
  );
}

export function MasterDataDialog(props: MasterDataDialogProps & { open: boolean }) {
  const t = useAdminTranslations();
  const { open, ...rest } = props;
  return (
    <Modal.Backdrop isOpen={open} onOpenChange={(next) => !next && rest.onClose()} className="adminOverlay">
      <Modal.Container size="md">
        <Modal.Dialog aria-label={t(rest.item ? "settings.dialog.edit" : "settings.dialog.add", { noun: rest.noun })}>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>
              {t(rest.item ? "settings.dialog.edit" : "settings.dialog.add", { noun: rest.noun })}
            </Modal.Heading>
          </Modal.Header>
          <DialogForm key={rest.item?.id ?? "new"} {...rest} />
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
