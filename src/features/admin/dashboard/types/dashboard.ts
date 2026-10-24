export type DashboardRange = "7d" | "30d" | "90d";
export type Currency = "USD" | "KHR";

export type DashboardRecentBooking = {
  reference: string;
  bookingStatus: string;
  customerName: string;
  vehicleName: string;
  pickupAt: string;
  totalPayableMinor: number;
  currency: Currency;
};

export type DashboardRevenue = { currency: Currency; bookedMinor: number; paidMinor: number };

export type DashboardTrends = {
  range: DashboardRange;
  bucketDays: number;
  revenue: Array<{ date: string; bookedMinor: number; paidMinor: number }>;
  bookings: Array<{ date: string; count: number }>;
};

export type DashboardOverview = {
  vehicles: { total: number; byStatus: Record<string, number> };
  bookings: { total: number; byStatus: Record<string, number>; activeNow: number; upcomingPickups7d: number; revenue: DashboardRevenue[] };
  loans: { total: number; byStatus: Record<string, number>; awaitingReview: number };
  customers: { total: number; newLast30Days: number };
  recentBookings: DashboardRecentBooking[];
  trends?: DashboardTrends;
};
