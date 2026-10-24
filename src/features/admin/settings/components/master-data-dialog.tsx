"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Description, FieldError, Input, Label, Modal, TextField } from "@heroui/react";
import { ArrowsClockwiseIcon, TrashIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ImageUploader } from "@/components/admin/forms/image-uploader";
import { ApiError } from "@/lib/api/error";
import { masterDataSchema, type MasterDataValues } from "../schemas/master-data-schema";
import type { MasterItem } from "../types/master-data";

export type MasterDataSubmit = { values: MasterDataValues; image: File | null; removeImage: boolean };

type MasterDataDialogProps = {
  noun: string;
  item: MasterItem | null;
  withImage: boolean;
  onClose: () => void;
  onSubmit: (submit: MasterDataSubmit) => Promise<void>;
};

function DialogForm({ noun, item, withImage, onClose, onSubmit }: MasterDataDialogProps) {
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
      setError(failure instanceof ApiError ? failure.message : "Couldn’t save. Try again.");
    }
  });

  return (
    <form onSubmit={submit} noValidate className="contents">
      <Modal.Body className="space-y-4">
        {error ? (
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Not saved</Alert.Title>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <TextField isRequired isInvalid={Boolean(fieldState.error)} value={field.value} onChange={field.onChange} autoFocus>
              <Label>Name</Label>
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
              <Label>Code</Label>
              <Input placeholder="generated from the name" />
              <Description>Used internally. Leave empty to generate it.</Description>
              <FieldError>{fieldState.error?.message}</FieldError>
            </TextField>
          )}
        />
        {withImage ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Image</p>
            {existingImage ? (
              <div className="space-y-2">
                <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]">
                  <Image src={existingImage} alt={item?.name ?? "Category image"} fill unoptimized className="object-cover" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" className="min-h-11 md:min-h-9" onPress={() => setReplacing(true)}>
                    <ArrowsClockwiseIcon size={15} />
                    Replace image
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="min-h-11 text-[var(--admin-danger)] md:min-h-9" onPress={() => setRemoveImage(true)}>
                    <TrashIcon size={15} />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <ImageUploader limit={1} maxSizeMb={5} aspectClass="aspect-[16/9]" emptyTitle={`Upload ${noun} image`} emptyHint="JPG, PNG or WebP · up to 5 MB" onChange={(files) => setImage(files[0] ?? null)} />
            )}
          </div>
        ) : null}
        <Controller
          control={form.control}
          name="active"
          render={({ field }) => (
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-[var(--admin-border)] p-3 text-sm font-semibold focus-within:ring-2 focus-within:ring-[var(--admin-accent-strong)]">
              <input type="checkbox" checked={field.value} onChange={(event) => field.onChange(event.target.checked)} className="size-4 accent-[#dcae00]" />
              Active
              <span className="text-xs font-normal text-[var(--admin-muted)]">Inactive items stay on existing records but can’t be picked for new ones.</span>
            </label>
          )}
        />
      </Modal.Body>
      <Modal.Footer className="flex justify-end gap-2">
        <Button type="button" variant="tertiary" className="min-h-11" onPress={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" className="min-h-11" isPending={form.formState.isSubmitting}>
          Save
        </Button>
      </Modal.Footer>
    </form>
  );
}

export function MasterDataDialog(props: MasterDataDialogProps & { open: boolean }) {
  const { open, ...rest } = props;
  return (
    <Modal.Backdrop isOpen={open} onOpenChange={(next) => !next && rest.onClose()} className="adminOverlay">
      <Modal.Container size="md">
        <Modal.Dialog aria-label={`${rest.item ? "Edit" : "Add"} ${rest.noun}`}>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>
              {rest.item ? "Edit" : "Add"} {rest.noun}
            </Modal.Heading>
          </Modal.Header>
          <DialogForm key={rest.item?.id ?? "new"} {...rest} />
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
