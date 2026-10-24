import type { AdminStatus } from "@/components/admin/data-display/status-badge";
import { bookingStatuses, type BookingStatus } from "@/features/admin/bookings/types/booking";
import type { CustomerEditValues } from "../schemas/customer-schemas";
import type { Customer, CustomerUpdateInput } from "../types/customer";

export const titleCase = (value: string) => value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());

export const loanBadge = (status: string): { status: AdminStatus; label: string } => {
  const map: Record<string, { status: AdminStatus; label: string }> = {
    draft: { status: "draft", label: "Draft" },
    submitted: { status: "submitted", label: "Submitted" },
    documents_under_review: { status: "under-review", label: "Documents under review" },
    additional_documents_required: { status: "action-required", label: "Additional documents required" },
    eligibility_review: { status: "eligibility", label: "Eligibility review" },
    approved: { status: "approved", label: "Approved" },
    rejected: { status: "rejected", label: "Rejected" },
  };
  return map[status] ?? { status: "pending", label: titleCase(status) };
};

export const documentBadge = (status: string): { status: AdminStatus; label: string } => {
  const map: Record<string, { status: AdminStatus; label: string }> = {
    uploaded: { status: "submitted", label: "Uploaded" },
    verified: { status: "verified", label: "Verified" },
    needs_review: { status: "needs-review", label: "Needs review" },
    rejected: { status: "rejected", label: "Rejected" },
  };
  return map[status] ?? { status: "pending", label: titleCase(status) };
};

export const asBookingStatus = (status: string): BookingStatus => ((bookingStatuses as readonly string[]).includes(status) ? (status as BookingStatus) : "pending");

export const monthsSince = (iso: string, now = Date.now()) => Math.max(0, Math.floor((now - Date.parse(iso)) / (30.44 * 86_400_000)));

export const customerToFormValues = (customer: Customer): CustomerEditValues => ({
  fullName: customer.profile.fullName ?? customer.name,
  phone: customer.phone ?? "",
  email: customer.email ?? "",
  dateOfBirth: customer.profile.dateOfBirth ?? "",
  nationality: customer.profile.nationality ?? "",
  city: customer.city ?? "",
  address: customer.profile.address ?? "",
});

/** Only filled fields are sent; the backend can't clear a stored value. */
export const formValuesToInput = (values: CustomerEditValues): CustomerUpdateInput => {
  const input: CustomerUpdateInput = { fullName: values.fullName };
  for (const key of ["phone", "email", "dateOfBirth", "nationality", "city", "address"] as const) if (values[key]) input[key] = values[key];
  return input;
};
