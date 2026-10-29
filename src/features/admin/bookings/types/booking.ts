export const bookingStatuses = ["pending", "confirmed", "ready_for_pickup", "active", "returned", "completed", "cancelled", "expired", "no_show"] as const;
export type BookingStatus = (typeof bookingStatuses)[number];

export const paymentStatuses = ["unpaid", "pending", "paid", "failed", "refunded", "partially_refunded"] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export const fuelLevels = ["full", "three_quarters", "half", "quarter", "empty"] as const;
export type FuelLevel = (typeof fuelLevels)[number];
export const vehicleConditions = ["excellent", "good", "fair", "needs_attention"] as const;
export type VehicleCondition = (typeof vehicleConditions)[number];

export type VehicleType = "motorcycle" | "scooter" | "car" | "other";
export type VehicleStatus = "available" | "rented" | "maintenance" | "inactive";

export type Place = { id: string; name: string; city: string; address: string };

export type Inspection = {
  occurredAt: string;
  odometerKm: number;
  fuelLevel: FuelLevel;
  condition: VehicleCondition;
  damageFound: boolean;
  damageNotes: string | null;
  licenceVerified: boolean | null;
  identityVerified: boolean | null;
  depositVerified: boolean | null;
  staffNotes: string | null;
  recordedBy: string | null;
};

export type BookingEvent = { fromStatus: string | null; toStatus: string; note: string | null; actor: string | null; at: string };
export type BookingTimelineItem = { kind: "created" | "payment_confirmed" | "confirmed" | "ready_for_pickup" | "handed_over" | "rental_active" | "returned" | "completed" | "cancelled" | "expired" | "no_show"; at: string; note: string | null; actor: string | null };

export type Booking = {
  reference: string;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  vehicle: {
    id: string;
    slug: string;
    name: string;
    brand: string;
    model: string;
    vehicleType: VehicleType;
    registrationNumber: string;
    status: VehicleStatus;
    image: { url: string | null; altText: string | null } | null;
  };
  customer: { id: string; name: string; email: string | null; phone: string | null };
  pickupLocation: Place;
  returnLocation: Place;
  pickupAt: string;
  returnAt: string;
  rentalDays: number;
  currency: "USD" | "KHR";
  pricing: {
    dailyRateMinor: number;
    rentalSubtotalMinor: number;
    addonsTotalMinor: number;
    platformFeeMinor: number;
    taxesMinor: number;
    securityDepositMinor: number;
    totalPayableMinor: number;
  };
  addons: Array<{ code: string | null; name: string; unitPriceMinor: number; quantity: number; days: number; totalMinor: number }>;
  holdExpiresAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  allowedNextStatuses: BookingStatus[];
  isOverdue: boolean;
  lateMinutes: number;
  distanceKm: number | null;
  canMarkNoShow: boolean;
  pickupInspection: Inspection | null;
  returnInspection: Inspection | null;
  events: BookingEvent[];
  timeline: BookingTimelineItem[];
};

export type BookingSort = "newest" | "oldest" | "pickup_asc" | "pickup_desc" | "total_asc" | "total_desc";
export type PickupWindow = "today" | "next7" | "last7";

export type BookingListParams = {
  page: number;
  pageSize: number;
  q?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  locationId?: string;
  pickup?: PickupWindow;
  overdue?: boolean;
  sort?: BookingSort;
};

export type BookingListMeta = { page: number; pageSize: number; total: number; totalPages: number };

export type BookingStatusInput = { bookingStatus?: BookingStatus; paymentStatus?: PaymentStatus; note?: string };

export type HandoverInput = {
  actualPickupAt?: string;
  odometerKm: number;
  fuelLevel: FuelLevel;
  condition: VehicleCondition;
  existingDamageNotes?: string;
  licenceVerified: boolean;
  identityVerified: boolean;
  depositVerified: boolean;
  staffNotes?: string;
};

export type ReturnInput = {
  actualReturnAt?: string;
  odometerKm: number;
  fuelLevel: FuelLevel;
  condition: VehicleCondition;
  newDamageFound: boolean;
  damageNotes?: string;
  staffNotes?: string;
};
