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

const mb = (bytes: number) => `${bytes / 1024 / 1024} MB`;

function VehicleMasters() {
  return (
    <div className="space-y-5">
      <MasterDataSection kind="vehicle_type" title="Vehicle Types" description="Top-level groups used when adding vehicles." noun="vehicle type" reorder />
      <MasterDataSection kind="vehicle_category" title="Vehicle Categories" description="Segments such as cruiser or commuter, shown with an image." noun="category" reorder withImage />
      <MasterDataSection kind="brand" title="Brands" description="Manufacturers available in the vehicle form." noun="brand" />
      <div className="grid items-start gap-5 xl:grid-cols-2">
        <MasterDataSection kind="transmission" title="Transmission Types" description="Gearbox options." noun="transmission" />
        <MasterDataSection kind="fuel_type" title="Fuel Types" description="Fuel and power options." noun="fuel type" />
      </div>
    </div>
  );
}

function BookingMasters() {
  return (
    <div className="space-y-5">
      <AddonsSection />
      <MasterDataSection kind="block_reason" title="Availability Block Reasons" description="Reasons offered when blocking a vehicle." noun="reason" reorder />
      <ReadOnlyList title="Booking Statuses" description="System workflow states. They can’t be renamed, reordered or removed." items={bookingWorkflowStatuses} />
    </div>
  );
}

function LoanMasters() {
  return (
    <div className="space-y-5">
      <MasterDataSection kind="loan_type" title="Loan Types" description="Standalone loan products customers can apply for." noun="loan type" reorder />
      <ReadOnlyList title="Document Types" description="Reference list of documents applicants can be asked to provide. Not configurable." items={documentTypeReference} />
      <ReadOnlyList title="Loan Statuses" description="System workflow states. They can’t be renamed or reordered." items={loanWorkflowStatuses} />
    </div>
  );
}

function PricingAndTax() {
  const query = useSystemRulesQuery();
  if (query.isError) return <AdminErrorState title="Couldn’t load pricing" description="Try again in a moment." onRetry={() => void query.refetch()} />;
  const rules = query.data;
  const loading = query.isLoading;
  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--admin-muted)]">These values are set by system configuration, so they can’t be edited here.</p>
      <div className="grid gap-4 md:grid-cols-3">
        <InfoTile label="VAT rate" loading={loading} value={rules ? `${rules.vatRateBps / 100}%` : undefined} hint="Applied to rental charges." />
        <InfoTile label="Platform fee" loading={loading} value={rules ? formatCurrency(rules.platformFeeUsdMinor, "USD") : undefined} hint="Added to each booking, in USD." />
        <InfoTile label="Booking hold" loading={loading} value={rules ? `${rules.bookingHoldMinutes} minutes` : undefined} hint="How long a pending booking keeps its vehicle." />
      </div>
    </div>
  );
}

function SystemRules() {
  const query = useSystemRulesQuery();
  if (query.isError) return <AdminErrorState title="Couldn’t load system rules" description="Try again in a moment." onRetry={() => void query.refetch()} />;
  const rules = query.data;
  const loading = query.isLoading;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <InfoTile label="Currency" value="USD" badge="System rule" hint="Prices and totals are shown in US dollars." />
      <InfoTile label="Timezone" value={rules?.timezone ?? "Asia/Phnom_Penh"} badge="System rule" loading={loading} hint="Dates and times use Cambodia time (ICT, UTC+7)." />
      <InfoTile label="Booking hold" loading={loading} value={rules ? `${rules.bookingHoldMinutes} minutes` : undefined} badge="System rule" hint="Unpaid reservations expire automatically." />
      <InfoTile label="Upload limits" loading={loading} badge="System rule">
        {rules ? (
          <ul className="space-y-1.5 text-sm">
            <li className="flex justify-between gap-3"><span className="text-[var(--admin-muted)]">Loan documents</span><strong>{mb(rules.uploadLimits.documentMaxBytes)}</strong></li>
            <li className="flex justify-between gap-3"><span className="text-[var(--admin-muted)]">Images</span><strong>{mb(rules.uploadLimits.imageMaxBytes)} each</strong></li>
          </ul>
        ) : null}
      </InfoTile>
      <InfoTile label="Payment provider" loading={loading} value={rules ? (rules.paymentProvider.enabled ? rules.paymentProvider.name ?? "Enabled" : "Not enabled") : undefined} badge={rules?.paymentProvider.enabled ? "Live" : "Deferred"} hint={rules?.paymentProvider.enabled ? "Customers can pay for bookings online." : "Online payments are not switched on yet."} />
    </div>
  );
}

export function SettingsPage() {
  return (
    <AdminPage>
      <PageHeader title="Settings" description="Master data and operational rules that drive RideGo." />
      <AdminTabs
        label="Settings sections"
        items={[
          { id: "vehicle", label: "Vehicle Masters", content: <VehicleMasters /> },
          { id: "booking", label: "Booking Masters", content: <BookingMasters /> },
          { id: "loan", label: "Loan Masters", content: <LoanMasters /> },
          { id: "pricing", label: "Pricing & Tax", content: <PricingAndTax /> },
          { id: "rules", label: "System Rules", content: <SystemRules /> },
        ]}
      />
    </AdminPage>
  );
}
