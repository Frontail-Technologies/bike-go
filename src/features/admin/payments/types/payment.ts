/** Attempt states exactly as the backend records them. */
export const paymentStatuses = ["pending", "paid", "failed"] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export type PaymentCurrency = "USD" | "KHR";

export type Payment = {
  transactionId: string;
  /** The payment provider that handled the attempt. The backend does not record a finer payment method. */
  provider: string;
  status: PaymentStatus;
  amountMinor: number;
  currency: PaymentCurrency;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  booking: {
    reference: string;
    bookingStatus: string;
    paymentStatus: string;
    vehicleName: string;
    pickupAt: string;
    returnAt: string;
    pickupLocation: { name: string; city: string };
    returnLocation: { name: string; city: string };
  };
  customer: { id: string; reference: string; name: string; phone: string | null; email: string | null };
};

/** The detail adds the provider's review note, when there is one. */
export type PaymentDetail = Payment & { review: string | null };

export type PaymentSort = "newest" | "oldest" | "amount_desc" | "amount_asc";
/** Date presets (days back); resolved to a date range when the request is sent. */
export type PaymentWindow = "7" | "30" | "90";

export type PaymentListParams = {
  page: number;
  pageSize: number;
  q?: string;
  status?: PaymentStatus;
  currency?: PaymentCurrency;
  window?: PaymentWindow;
  sort?: PaymentSort;
};
export type PaymentListMeta = { page: number; pageSize: number; total: number; totalPages: number };
