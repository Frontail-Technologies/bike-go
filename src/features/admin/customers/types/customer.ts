export type CustomerSort = "newest" | "oldest" | "name";

export type CustomerListParams = { page: number; pageSize: number; q?: string; sort?: CustomerSort };
export type CustomerListMeta = { page: number; pageSize: number; total: number; totalPages: number };

export type CustomerSummary = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  providers: string[];
  bookingCount: number;
  loanCount: number;
  createdAt: string;
};

export type Customer = CustomerSummary & {
  profile: { fullName: string | null; dateOfBirth: string | null; nationality: string | null; address: string | null; telegramUsername: string | null };
  recentBookings: Array<{ reference: string; bookingStatus: string; vehicleName: string; pickupAt: string; totalPayableMinor: number; currency: string }>;
  recentLoans: Array<{ reference: string; status: string; loanType: string; requestedAmountMinor: number; currency: string; createdAt: string }>;
};

/** Profile fields the backend lets staff correct. Anything omitted is left unchanged. */
export type CustomerUpdateInput = Partial<{ fullName: string; phone: string; email: string; dateOfBirth: string; nationality: string; city: string; address: string }>;

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
  uploadedAt: string;
  loan: { reference: string; loanType: string; status: string };
};
