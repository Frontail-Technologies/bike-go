import { bookingStatuses, type BookingStatus } from "@/features/admin/bookings/types/booking";
import type { CustomerEditValues } from "../schemas/customer-schemas";
import type { Customer, CustomerUpdateInput } from "../types/customer";

export const titleCase = (value: string) => value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());

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

export const formValuesToInput = (values: CustomerEditValues): CustomerUpdateInput => {
  const input: CustomerUpdateInput = { fullName: values.fullName };
  for (const key of ["phone", "email", "dateOfBirth", "nationality", "city", "address"] as const) if (values[key]) input[key] = values[key];
  return input;
};
