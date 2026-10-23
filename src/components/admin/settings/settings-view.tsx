"use client";

import { AdminPage, PageHeader } from "@/components/admin/layout";
import { AdminTabs } from "@/components/admin/navigation";
import { InfoTile, MasterDataSection, ReadOnlyList } from "./master-data";
import { addons, blockReasons, bookingStatusList, brands, documentTypeMasters, fuelTypes, holdMinutes, loanStatusList, loanTypeMasters, platformFee, transmissions, vatRate, vehicleCategories, vehicleTypes } from "./settings-data";

const vehicle = (
  <div className="space-y-5">
    <MasterDataSection title="Vehicle Types" description="Top-level groups used when adding vehicles." noun="vehicle type" initial={vehicleTypes} fields={["name", "code"]} reorder />
    <MasterDataSection title="Vehicle Categories" description="Segments such as cruiser or commuter." noun="category" initial={vehicleCategories} fields={["name", "code", "image"]} reorder />
    <MasterDataSection title="Brands" description="Manufacturers available in the vehicle form." noun="brand" initial={brands} fields={["name"]} />
    <div className="grid items-start gap-5 xl:grid-cols-2">
      <MasterDataSection title="Transmission Types" description="Gearbox options." noun="transmission" initial={transmissions} fields={["name"]} />
      <MasterDataSection title="Fuel Types" description="Fuel and power options." noun="fuel type" initial={fuelTypes} fields={["name"]} />
    </div>
  </div>
);

const booking = (
  <div className="space-y-5">
    <MasterDataSection title="Add-ons" description="Extras customers can add to a booking, priced per day." noun="add-on" initial={addons} fields={["name", "code", "description", "price"]} />
    <MasterDataSection title="Availability Block Reasons" description="Reasons offered when blocking a vehicle." noun="reason" initial={blockReasons} fields={["name"]} />
    <ReadOnlyList title="Booking Statuses" description="System workflow states. They can’t be renamed, reordered or removed." items={bookingStatusList} />
  </div>
);

const loan = (
  <div className="space-y-5">
    <MasterDataSection title="Loan Types" description="Standalone loan products customers can apply for." noun="loan type" initial={loanTypeMasters} fields={["name"]} />
    <MasterDataSection title="Document Types" description="Documents applicants can be asked to provide." noun="document type" initial={documentTypeMasters} fields={["name"]} allowAdd={false} allowEdit={false} />
    <ReadOnlyList title="Loan Statuses" description="System workflow states. They can’t be renamed or reordered." items={loanStatusList} />
  </div>
);

const pricing = (
  <div className="space-y-4">
    <p className="text-sm text-[var(--admin-muted)]">These values come from system configuration. They become editable once settings are stored by the backend.</p>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <InfoTile label="VAT rate" value={vatRate} hint="Applied to rental charges." />
      <InfoTile label="Platform fee (USD)" value={platformFee.usd} hint="For bookings paid in USD." />
      <InfoTile label="Platform fee (KHR)" value={platformFee.khr} hint="For bookings paid in KHR." />
      <InfoTile label="Booking hold" value={`${holdMinutes} minutes`} hint="How long a pending booking keeps its vehicle." />
    </div>
  </div>
);

const rules = (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    <InfoTile label="Currencies" value="USD · KHR" badge="System rule" hint="Amounts are never combined across currencies." />
    <InfoTile label="Timezone" value="Asia/Phnom_Penh" badge="System rule" hint="All dates and times use Cambodia time (ICT, UTC+7)." />
    <InfoTile label="Booking hold" value={`${holdMinutes} minutes`} badge="System rule" hint="Unpaid reservations expire automatically." />
    <InfoTile label="Upload limits" badge="System rule">
      <ul className="space-y-1.5 text-sm"><li className="flex justify-between gap-3"><span className="text-[var(--admin-muted)]">Loan documents</span><strong>5 MB</strong></li><li className="flex justify-between gap-3"><span className="text-[var(--admin-muted)]">Banner images</span><strong>5 MB</strong></li><li className="flex justify-between gap-3"><span className="text-[var(--admin-muted)]">Vehicle images</span><strong>5 MB each</strong></li></ul>
    </InfoTile>
    <InfoTile label="Payment provider" value="ABA" badge="Deferred" hint="Not integrated yet. Payments are shown as records only." />
  </div>
);

export function SettingsView() {
  return (
    <AdminPage>
      <PageHeader title="Settings" description="Master data and business rules that drive RideGo operations." />
      <AdminTabs label="Settings sections" items={[
        { id: "vehicle", label: "Vehicle Masters", content: vehicle },
        { id: "booking", label: "Booking Masters", content: booking },
        { id: "loan", label: "Loan Masters", content: loan },
        { id: "pricing", label: "Pricing & Tax", content: pricing },
        { id: "rules", label: "System Rules", content: rules },
      ]} />
    </AdminPage>
  );
}
