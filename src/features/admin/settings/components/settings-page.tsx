"use client";

import { AdminErrorState } from "@/components/admin/feedback";
import { AdminPage, PageHeader } from "@/components/admin/layout";
import { formatCurrency } from "@/components/admin/money";
import { AdminTabs } from "@/components/admin/navigation";
import { bookingWorkflowStatuses, documentTypeReference, loanWorkflowStatuses } from "../constants";
import { useSystemRulesQuery } from "../hooks/use-system-rules";
import { AddonsSection } from "./addons-section";
import { MasterDataSection } from "./master-data-section";
import { InfoTile, ReadOnlyList } from "./read-only";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

const mb = (bytes: number) => `${bytes / 1024 / 1024} MB`;

function VehicleMasters() {
  const t = useAdminTranslations();
  return (
    <div className="space-y-5">
      <MasterDataSection kind="vehicle_type" title={t("settings.sections.vehicleTypes.title")} description={t("settings.sections.vehicleTypes.description")} noun={t("settings.sections.vehicleTypes.noun")} reorder />
      <MasterDataSection kind="vehicle_category" title={t("settings.sections.categories.title")} description={t("settings.sections.categories.description")} noun={t("settings.sections.categories.noun")} reorder withImage />
      <MasterDataSection kind="brand" title={t("settings.sections.brands.title")} description={t("settings.sections.brands.description")} noun={t("settings.sections.brands.noun")} />
      <div className="grid items-start gap-5 xl:grid-cols-2">
        <MasterDataSection kind="transmission" title={t("settings.sections.transmissions.title")} description={t("settings.sections.transmissions.description")} noun={t("settings.sections.transmissions.noun")} />
        <MasterDataSection kind="fuel_type" title={t("settings.sections.fuelTypes.title")} description={t("settings.sections.fuelTypes.description")} noun={t("settings.sections.fuelTypes.noun")} />
      </div>
    </div>
  );
}

function BookingMasters() {
  const t = useAdminTranslations();
  return (
    <div className="space-y-5">
      <AddonsSection />
      <MasterDataSection kind="block_reason" title={t("settings.sections.blockReasons.title")} description={t("settings.sections.blockReasons.description")} noun={t("settings.sections.blockReasons.noun")} reorder />
      <ReadOnlyList title={t("settings.sections.bookingStatuses.title")} description={t("settings.sections.bookingStatuses.description")} items={bookingWorkflowStatuses.map((status) => t(`bookings.status.${status}`))} />
    </div>
  );
}

function LoanMasters() {
  const t = useAdminTranslations();
  return (
    <div className="space-y-5">
      <MasterDataSection kind="loan_type" title={t("settings.sections.loanTypes.title")} description={t("settings.sections.loanTypes.description")} noun={t("settings.sections.loanTypes.noun")} reorder />
      <ReadOnlyList title={t("settings.sections.documentTypes.title")} description={t("settings.sections.documentTypes.description")} items={documentTypeReference.map((type) => t(`loans.documentTypes.${type}`))} />
      <ReadOnlyList title={t("settings.sections.loanStatuses.title")} description={t("settings.sections.loanStatuses.description")} items={loanWorkflowStatuses.map((status) => t(`loans.status.${status}`))} />
    </div>
  );
}

function PricingAndTax() {
  const t = useAdminTranslations();
  const query = useSystemRulesQuery();
  if (query.isError) return <AdminErrorState title={t("settings.pricing.loadError")} description={t("common.retryLater")} onRetry={() => void query.refetch()} />;
  const rules = query.data;
  const loading = query.isLoading;
  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--admin-muted)]">{t("settings.pricing.note")}</p>
      <div className="grid gap-4 md:grid-cols-3">
        <InfoTile label={t("settings.pricing.vat")} loading={loading} value={rules ? `${rules.vatRateBps / 100}%` : undefined} hint={t("settings.pricing.vatHint")} />
        <InfoTile label={t("settings.pricing.platformFee")} loading={loading} value={rules ? formatCurrency(rules.platformFeeUsdMinor, "USD") : undefined} hint={t("settings.pricing.platformFeeHint")} />
        <InfoTile label={t("settings.pricing.hold")} loading={loading} value={rules ? t("settings.pricing.minutes", { count: rules.bookingHoldMinutes }) : undefined} hint={t("settings.pricing.holdHint")} />
      </div>
    </div>
  );
}

function SystemRules() {
  const t = useAdminTranslations();
  const query = useSystemRulesQuery();
  if (query.isError) return <AdminErrorState title={t("settings.rules.loadError")} description={t("common.retryLater")} onRetry={() => void query.refetch()} />;
  const rules = query.data;
  const loading = query.isLoading;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <InfoTile label={t("settings.rules.currency")} value="USD" badge={t("settings.rules.systemRule")} hint={t("settings.rules.currencyHint")} />
      <InfoTile label={t("settings.rules.timezone")} value={rules?.timezone ?? "Asia/Phnom_Penh"} badge={t("settings.rules.systemRule")} loading={loading} hint={t("settings.rules.timezoneHint")} />
      <InfoTile label={t("settings.pricing.hold")} loading={loading} value={rules ? t("settings.pricing.minutes", { count: rules.bookingHoldMinutes }) : undefined} badge={t("settings.rules.systemRule")} hint={t("settings.rules.holdHint")} />
      <InfoTile label={t("settings.rules.uploadLimits")} loading={loading} badge={t("settings.rules.systemRule")}>
        {rules ? (
          <ul className="space-y-1.5 text-sm">
            <li className="flex justify-between gap-3"><span className="text-[var(--admin-muted)]">{t("settings.rules.loanDocuments")}</span><strong>{mb(rules.uploadLimits.documentMaxBytes)}</strong></li>
            <li className="flex justify-between gap-3"><span className="text-[var(--admin-muted)]">{t("settings.rules.images")}</span><strong>{t("settings.rules.each", { size: mb(rules.uploadLimits.imageMaxBytes) })}</strong></li>
          </ul>
        ) : null}
      </InfoTile>
      <InfoTile label={t("settings.rules.provider")} loading={loading} value={rules ? (rules.paymentProvider.enabled ? rules.paymentProvider.name ?? t("settings.rules.enabled") : t("settings.rules.notEnabled")) : undefined} badge={rules?.paymentProvider.enabled ? t("settings.rules.live") : t("settings.rules.deferred")} hint={rules?.paymentProvider.enabled ? t("settings.rules.liveHint") : t("settings.rules.deferredHint")} />
    </div>
  );
}

export function SettingsPage() {
  const t = useAdminTranslations();
  return (
    <AdminPage>
      <PageHeader title={t("pages.settings.title")} description={t("pages.settings.description")} />
      <AdminTabs
        label={t("settings.tabs.label")}
        items={[
          { id: "vehicle", label: t("settings.tabs.vehicle"), content: <VehicleMasters /> },
          { id: "booking", label: t("settings.tabs.booking"), content: <BookingMasters /> },
          { id: "loan", label: t("settings.tabs.loan"), content: <LoanMasters /> },
          { id: "pricing", label: t("settings.tabs.pricing"), content: <PricingAndTax /> },
          { id: "rules", label: t("settings.tabs.rules"), content: <SystemRules /> },
        ]}
      />
    </AdminPage>
  );
}
