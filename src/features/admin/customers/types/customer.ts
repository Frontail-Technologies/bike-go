export type CustomerSort = "newest" | "oldest" | "name";
export type CustomerStatus = "active" | "inactive";
/** Joined-date presets; resolved to a date range when the request is sent. */
export type JoinedWindow = "30" | "90" | "180";

export type CustomerListParams = {
  page: number;
  pageSize: number;
  q?: string;
  status?: CustomerStatus;
  city?: string;
  joined?: JoinedWindow;
  sort?: CustomerSort;
};
export type CustomerListMeta = { page: number; pageSize: number; total: number; totalPages: number };

export type CustomerSummary = {
  id: string;
  reference: string;
  status: CustomerStatus;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  providers: string[];
  bookingCount: number;
  loanCount: number;
  activeRentals: number;
  createdAt: string;
};

export type Customer = CustomerSummary & {
  profile: { fullName: string | null; dateOfBirth: string | null; nationality: string | null; address: string | null; telegramUsername: string | null };
  metrics: { totalBookings: number; activeRentals: number; totalSpentMinor: number };
  recentBookings: Array<{ reference: string; bookingStatus: string; vehicleName: string; pickupAt: string; totalPayableMinor: number; currency: string }>;
  recentLoans: Array<{ reference: string; status: string; loanType: string; requestedAmountMinor: number; currency: string; createdAt: string }>;
};

export type CustomerStats = { total: number; active: number; inactive: number; newLast30Days: number; withActiveRentals: number; cities: string[] };

/** Profile fields the backend lets staff correct. Anything omitted is left unchanged. */
export type CustomerUpdateInput = Partial<{ fullName: string; phone: string; email: string; dateOfBirth: string; nationality: string; city: string; address: string; status: CustomerStatus }>;

export type PageParams = { page: number; pageSize: number };

export type CustomerLoan = {
  reference: string;
  status: string;
  loanType: string;
  currency: "USD" | "KHR";
  requestedAmountMinor: number;
  tenureMonths: number;
  submittedAt: string | null;
  createdAt: string;
};

export type CustomerDocument = {
  id: string;
  type: string;
  originalFilename: string;
  verificationStatus: string;
  reviewNote: string | null;
  uploadedAt: string;
  loan: { reference: string; loanType: string; status: string };
  /** Staff-only download path; the storage key is never exposed. */
  fileUrl: string;
};

export type DocumentReviewInput = { verificationStatus: "verified" | "needs_review" | "rejected"; note?: string };

export type CustomerActivity = { id: string; kind: "account" | "booking" | "loan" | "document"; title: string; detail: string | null; reference: string | null; at: string };
