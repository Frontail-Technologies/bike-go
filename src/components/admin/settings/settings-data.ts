import { bookingLabels, bookingStatuses } from "@/components/admin/bookings/booking-data";
import { allDocumentTypes, loanStatuses, loanStatusLabels } from "@/components/admin/loans/loan-types";
import type { CurrencyCode } from "@/components/admin/money";

export type MasterItem = { id: string; name: string; code: string; description?: string; priceMinor?: number; currency?: CurrencyCode; imageUrl?: string; active: boolean };

const make = (names: string[], inactive: string[] = []): MasterItem[] => names.map((name) => ({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name, code: name.toLowerCase().replace(/[^a-z0-9]+/g, "_"), active: !inactive.includes(name) }));

export const vehicleTypes = make(["Motorcycle", "Scooter", "Car", "Other"]);
export const vehicleCategories = make(["Cruiser", "Sport", "Adventure", "Touring", "Commuter", "Premium"], ["Touring"]);
export const brands = make(["Honda", "Yamaha", "Royal Enfield", "KTM", "Suzuki", "Toyota", "Ford"], ["Ford"]);
export const transmissions = make(["Automatic", "Manual", "CVT"]);
export const fuelTypes = make(["Petrol", "Diesel", "Electric", "Hybrid"], ["Diesel"]);

export const addons: MasterItem[] = [
  { id: "helmet", name: "Helmet", code: "HELMET", description: "Certified full-face helmet, sizes M to XL.", priceMinor: 300, currency: "USD", active: true },
  { id: "jacket", name: "Riding Jacket", code: "JACKET", description: "Ventilated riding jacket with shoulder protection.", priceMinor: 500, currency: "USD", active: true },
  { id: "phone-holder", name: "Phone Holder", code: "PHONE_HOLDER", description: "Handlebar phone mount for navigation.", priceMinor: 8000, currency: "KHR", active: true },
  { id: "rain-cover", name: "Rain Cover", code: "RAIN_COVER", description: "Lightweight rain poncho set.", priceMinor: 4000, currency: "KHR", active: false },
];
export const blockReasons = make(["Scheduled Maintenance", "Safety Inspection", "Repair", "Reserved", "Other"]);
export const loanTypeMasters = make(["Personal Loan", "Emergency Loan", "Business Loan", "Other"]);
export const documentTypeMasters = make([...allDocumentTypes].map((value) => value));

export const bookingStatusList = bookingStatuses.map((value) => bookingLabels[value]);
export const loanStatusList = loanStatuses.map((value) => loanStatusLabels[value]);

export const vatRate = "10%";
export const platformFee = { usd: "$1.50", khr: "៛6,150" };
export const holdMinutes = 15;
