"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Description, FieldError, Input, Label, Modal, TextArea, TextField } from "@heroui/react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { AdminButton as Button } from "@/components/admin/controls";
import { CurrencyAmount } from "@/components/admin/money";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/error";
import { usePaymentMutations } from "../hooks/use-payments";
import { toDecimal, toMinor } from "../lib/payment-model";
import { refundFormSchema, type RefundFormValues } from "../schemas/payment-schemas";
import type { PaymentDetail } from "../types/payment";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

function RefundForm({ payment, onClose }: { payment: PaymentDetail; onClose: () => void }) {
  const t = useAdminTranslations();
  const mutations = usePaymentMutations(payment.transactionId);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [error, setError] = useState("");
  const paid = payment.paidAmountMinor ?? payment.amountMinor;
  const form = useForm<RefundFormValues>({ resolver: zodResolver(refundFormSchema), defaultValues: { amount: toDecimal(payment.refundableMinor), reason: "" } });

  const submit = form.handleSubmit(async (values) => {
    const amountMinor = toMinor(values.amount);
    if (amountMinor > payment.refundableMinor) { form.setError("amount", { message: t("payments.refund.maxAmount", { amount: toDecimal(payment.refundableMinor), currency: payment.currency }) }); return; }
    setError("");
    try {
      const result = await mutations.refund.mutateAsync({ amountMinor, reason: values.reason.trim(), idempotencyKey });
      toast.success(result.refund.status === "completed" ? t("payments.refund.processed") : t("payments.refund.submitted"), { description: `${toDecimal(amountMinor)} ${payment.currency} · ${payment.transactionId}` });
      onClose();
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : t("payments.refund.error"));
    }
  });

  return (
    <form onSubmit={submit} noValidate className="contents">
      <Modal.Body className="space-y-4">
        <dl className="adminTile grid grid-cols-3 gap-3 rounded-xl p-3 text-sm">
          <div><dt className="text-[11px] text-[var(--admin-muted)]">{t("payments.refund.paidAmount")}</dt><dd className="font-bold"><CurrencyAmount amount={paid} currency={payment.currency} /></dd></div>
          <div><dt className="text-[11px] text-[var(--admin-muted)]">{t("payments.refund.alreadyRefunded")}</dt><dd className="font-bold"><CurrencyAmount amount={payment.refundedMinor} currency={payment.currency} /></dd></div>
          <div><dt className="text-[11px] text-[var(--admin-muted)]">{t("payments.refund.remaining")}</dt><dd className="font-bold"><CurrencyAmount amount={payment.refundableMinor} currency={payment.currency} /></dd></div>
        </dl>
        <Controller control={form.control} name="amount" render={({ field, fieldState }) => (
          <TextField isRequired isInvalid={Boolean(fieldState.error)} value={field.value} onChange={field.onChange} inputMode="decimal">
            <Label>{t("payments.refund.amount", { currency: payment.currency })}</Label>
            <Input />
            <Description>{t("payments.refund.amountHint")}</Description>
            <FieldError>{fieldState.error?.message}</FieldError>
          </TextField>
        )} />
        <Controller control={form.control} name="reason" render={({ field, fieldState }) => (
          <TextField isRequired isInvalid={Boolean(fieldState.error)} value={field.value} onChange={(value) => field.onChange(value.slice(0, 300))}>
            <Label>{t("payments.refund.reason")}</Label>
            <TextArea rows={3} placeholder={t("payments.refund.reasonPlaceholder")} />
            <FieldError>{fieldState.error?.message}</FieldError>
          </TextField>
        )} />
        <p className="text-xs text-[var(--admin-muted)]">{t("payments.refund.hint")}</p>
        {error ? <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>{t("payments.refund.notProcessed")}</Alert.Title><Alert.Description>{error}</Alert.Description></Alert.Content></Alert> : null}
      </Modal.Body>
      <Modal.Footer className="flex justify-end gap-2">
        <Button type="button" variant="tertiary" className="min-h-11" onPress={onClose}>{t("common.cancel")}</Button>
        <Button type="submit" variant="danger" className="min-h-11" isPending={form.formState.isSubmitting}>{t("payments.refund.process")}</Button>
      </Modal.Footer>
    </form>
  );
}

export function RefundDialog({ payment, isOpen, onOpenChange }: { payment: PaymentDetail; isOpen: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useAdminTranslations();
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="adminOverlay">
      <Modal.Container size="md">
        <Modal.Dialog aria-label={t("payments.refund.title")}>
          <Modal.CloseTrigger />
          <Modal.Header><Modal.Heading>{t("payments.refund.title")}</Modal.Heading></Modal.Header>
          <RefundForm key={`${payment.transactionId}-${payment.refundedMinor}`} payment={payment} onClose={() => onOpenChange(false)} />
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
