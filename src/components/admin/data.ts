export type Currency = "USD" | "KHR";
export type DashboardPeriod = 7 | 30 | 90;
export type RevenueTrendPoint = { label: string; bookedMinor: number; paidMinor: number };
export type MetricPoint = { label: string; value: number };
export type StatusMetric = { label: string; value: number; color: string };
export type VehicleStatus = "available" | "rented" | "maintenance" | "inactive";
export type VehicleType = "motorcycle" | "scooter" | "car" | "other";

export type AdminLocation = { id: string; name: string; address: string; city: string; latitude: number | null; longitude: number | null; active: boolean };
export type AdminVehicle = {
  id: string; slug: string; vehicleType: VehicleType; name: string; brand: string; model: string; category: string; description: string | null;
  engineCc: number | null; transmission: string | null; fuelType: string | null; seats: number | null; dailyRentalPriceMinor: number; securityDepositMinor: number;
  currency: Currency; status: VehicleStatus; specifications: Record<string, unknown>; registrationNumber: string;
  location: Pick<AdminLocation, "id" | "name" | "city" | "address">; images: Array<{ id: string; url: string | null; altText: string | null; sortOrder: number }>; createdAt: string; updatedAt: string;
};
export type VehicleInput = Omit<AdminVehicle, "id" | "location" | "images" | "createdAt" | "updatedAt"> & { locationId: string };
export type DashboardData = {
  vehicles: { total: number; byStatus: Record<string, number> };
  bookings: { total: number; byStatus: Record<string, number>; activeNow: number; upcomingPickups7d: number; revenue: Array<{ currency: Currency; bookedMinor: number; paidMinor: number }> };
  loans: { total: number; byStatus: Record<string, number>; awaitingReview: number };
  customers: { total: number; newLast30Days: number };
  recentBookings: Array<{ reference: string; bookingStatus: string; customerName: string; vehicleName: string; pickupAt: string; totalPayableMinor: number; currency: Currency }>;
  recentLoans: Array<{ reference: string; status: string; applicantName: string | null; loanType: string; requestedAmountMinor: number; currency: Currency; createdAt: string }>;
  charts: {
    revenue: Record<Currency, Record<DashboardPeriod, RevenueTrendPoint[]>>;
    bookingVolume: Record<DashboardPeriod, MetricPoint[]>;
    bookingStatus: StatusMetric[];
    loanStatus: StatusMetric[];
  };
  pendingDocumentReviews: number;
};

function makeRevenueSeries(period: DashboardPeriod, currency: Currency): RevenueTrendPoint[] {
  const points = period === 7 ? 7 : period === 30 ? 10 : 13;
  const bookedBase = currency === "USD" ? 118000 : 4720000;
  const paidBase = currency === "USD" ? 89000 : 3560000;
  return Array.from({ length: points }, (_, index) => {
    const day = Math.round(1 + (index * (period - 1)) / Math.max(1, points - 1));
    const variation = 0.82 + ((index * 7) % 5) * 0.09 + index * 0.025;
    return {
      label: `${day}d`,
      bookedMinor: Math.round(bookedBase * variation),
      paidMinor: Math.round(paidBase * (variation - 0.05)),
    };
  });
}

function makeVolumeSeries(period: DashboardPeriod): MetricPoint[] {
  const points = period === 7 ? 7 : period === 30 ? 10 : 13;
  return Array.from({ length: points }, (_, index) => ({
    label: `${Math.round(1 + (index * (period - 1)) / Math.max(1, points - 1))}d`,
    value: 7 + ((index * 5 + period) % 12),
  }));
}

export const adminLocations: AdminLocation[] = [
  { id: "11111111-1111-4111-8111-111111111111", name: "Phnom Penh Central", city: "Phnom Penh", address: "125 Norodom Boulevard, Chamkarmon", latitude: 11.5504, longitude: 104.9212, active: true },
  { id: "22222222-2222-4222-8222-222222222222", name: "Siem Reap Riverside", city: "Siem Reap", address: "56 Sivutha Boulevard, Old Market", latitude: 13.354, longitude: 103.855, active: true },
  { id: "33333333-3333-4333-8333-333333333333", name: "Sihanoukville Port", city: "Sihanoukville", address: "18 Ekareach Street", latitude: 10.6253, longitude: 103.5234, active: true },
  { id: "44444444-4444-4444-8444-444444444444", name: "Phnom Penh Airport", city: "Phnom Penh", address: "Russian Federation Boulevard", latitude: 11.5466, longitude: 104.8441, active: false },
];

const vehicleSeeds = [
  ["Honda Click 125", "honda", "Click 125", "Scooter", "scooter", "available", 1200, 20000, 0],
  ["Yamaha NMAX 155", "Yamaha", "NMAX 155", "Premium Scooter", "scooter", "rented", 1800, 25000, 1],
  ["Honda PCX 160", "Honda", "PCX 160", "Premium Scooter", "scooter", "maintenance", 2000, 30000, 0],
  ["Toyota Vios", "Toyota", "Vios", "Sedan", "car", "available", 4500, 50000, 0],
  ["Yamaha MT-15", "Yamaha", "MT-15", "Street", "motorcycle", "available", 1600, 25000, 1],
  ["KTM Duke 250", "KTM", "Duke 250", "Street", "motorcycle", "rented", 2200, 35000, 0],
  ["Suzuki Burgman", "Suzuki", "Burgman", "Maxi Scooter", "scooter", "available", 1800, 25000, 2],
  ["Toyota Fortuner", "Toyota", "Fortuner", "SUV", "car", "available", 8000, 80000, 1],
  ["Royal Enfield Classic", "Royal Enfield", "Classic 350", "Classic", "motorcycle", "inactive", 2800, 40000, 0],
  ["Honda ADV 160", "Honda", "ADV 160", "Adventure Scooter", "scooter", "available", 2400, 30000, 2],
  ["Ford Ranger", "Ford", "Ranger", "Pickup", "car", "maintenance", 9500, 100000, 0],
  ["City Commuter", "RideGo", "City One", "Commuter", "other", "available", 1000, 15000, 1],
] as const;

export const adminVehicles: AdminVehicle[] = vehicleSeeds.map((seed, index) => {
  const [name, brand, model, category, vehicleType, status, dailyRentalPriceMinor, securityDepositMinor, locationIndex] = seed;
  const location = adminLocations[locationIndex];
  return { id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), name, brand, model, category, vehicleType, status, description: `${name} is maintained for dependable travel across Cambodia.`, engineCc: vehicleType === "car" ? 1500 : vehicleType === "other" ? null : Number(model.match(/\d+/)?.[0] ?? 125), transmission: vehicleType === "car" ? "Automatic" : "CVT", fuelType: "Petrol", seats: vehicleType === "car" ? 5 : 2, dailyRentalPriceMinor, securityDepositMinor, currency: "USD", registrationNumber: `RG-${String(index + 1).padStart(4, "0")}`, specifications: {}, location, images: [], createdAt: "2026-10-01T03:00:00.000Z", updatedAt: "2026-10-20T03:00:00.000Z" };
});

export const adminDashboard: DashboardData = {
  vehicles: { total: adminVehicles.length, byStatus: { available: 7, rented: 2, maintenance: 2, inactive: 1 } },
  bookings: { total: 124, activeNow: 36, upcomingPickups7d: 8, byStatus: { completed: 62, active: 24, cancelled: 16, pending: 12, no_show: 10 }, revenue: [{ currency: "USD", bookedMinor: 1245000, paidMinor: 986000 }, { currency: "KHR", bookedMinor: 18400000, paidMinor: 15100000 }] },
  loans: { total: 28, awaitingReview: 7, byStatus: { submitted: 4, documents_under_review: 3, approved: 15, rejected: 6 } }, customers: { total: 842, newLast30Days: 46 },
  recentBookings: [
    { reference: "BND0124", bookingStatus: "active", customerName: "Sokha Chan", vehicleName: "Toyota Vios", pickupAt: "2026-10-23T03:00:00.000Z", totalPayableMinor: 4500, currency: "USD" },
    { reference: "BND0123", bookingStatus: "completed", customerName: "Marie Tan", vehicleName: "Honda Click 125", pickupAt: "2026-10-22T02:00:00.000Z", totalPayableMinor: 5200, currency: "USD" },
    { reference: "BND0122", bookingStatus: "confirmed", customerName: "David Kim", vehicleName: "Yamaha NMAX 155", pickupAt: "2026-10-25T04:00:00.000Z", totalPayableMinor: 320000, currency: "KHR" },
  ],
  recentLoans: [
    { reference: "LNN0028", status: "documents_under_review", applicantName: "Davit Park", loanType: "vehicle", requestedAmountMinor: 500000, currency: "USD", createdAt: "2026-10-23T02:00:00.000Z" },
    { reference: "LNN0027", status: "approved", applicantName: "Kim Sopheap", loanType: "personal", requestedAmountMinor: 350000, currency: "USD", createdAt: "2026-10-22T07:00:00.000Z" },
  ],
  pendingDocumentReviews: 9,
  charts: {
    revenue: {
      USD: { 7: makeRevenueSeries(7, "USD"), 30: makeRevenueSeries(30, "USD"), 90: makeRevenueSeries(90, "USD") },
      KHR: { 7: makeRevenueSeries(7, "KHR"), 30: makeRevenueSeries(30, "KHR"), 90: makeRevenueSeries(90, "KHR") },
    },
    bookingVolume: { 7: makeVolumeSeries(7), 30: makeVolumeSeries(30), 90: makeVolumeSeries(90) },
    bookingStatus: [
      { label: "Completed", value: 62, color: "var(--admin-success)" },
      { label: "Active", value: 24, color: "var(--admin-info)" },
      { label: "Cancelled", value: 16, color: "var(--admin-danger)" },
      { label: "Pending", value: 12, color: "var(--admin-warning)" },
      { label: "Expired", value: 10, color: "var(--admin-muted)" },
    ],
    loanStatus: [
      { label: "Approved", value: 15, color: "var(--admin-success)" },
      { label: "Documents under review", value: 3, color: "var(--admin-info)" },
      { label: "Submitted", value: 4, color: "var(--admin-warning)" },
      { label: "Rejected", value: 6, color: "var(--admin-danger)" },
    ],
  },
};
