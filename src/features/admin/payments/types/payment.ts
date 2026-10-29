export const paymentStatuses = ["pending", "paid", "failed"] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export type RefundState = "none" | "partial" | "full";
export type PaymentCurrency = "USD" | "KHR";

export type Payment = {
  transactionId: string;
  provider: string;
  method: string | null;
  status: PaymentStatus;
  refundState: RefundState;
  displayStatus: "pending" | "paid" | "failed" | "partially_refunded" | "refunded";
  amountMinor: number;
  refundedMinor: number;
  netMinor: number;
  currency: PaymentCurrency;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  booking: {
    reference: string;
    bookingStatus: string;
    paymentStatus: string;
    vehicleName: string;
    vehicleId: string;
    vehicleType: "motorcycle" | "scooter" | "car" | "other";
    vehicleImage: { url: string | null; altText: string | null } | null;
    pickupAt: string;
    returnAt: string;
    pickupLocation: { name: string; city: string };
    returnLocation: { name: string; city: string };
  };
  customer: { id: string; reference: string; name: string; phone: string | null; email: string | null };
};

export type RefundStatus = "pending" | "completed" | "failed";

export type PaymentRefund = {
  id: string;
  amountMinor: number;
  currency: PaymentCurrency;
  status: RefundStatus;
  reason: string;
  initiatedBy: string | null;
  providerCode: string | null;
  providerMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  failedAt: string | null;
};

export type ProviderOperation = { status: string; amountMinor: number | null; at: string | null; bankRef: string | null };

export type PaymentDetail = Payment & {
  review: string | null;
  providerStatus: string | null;
  approvalCode: string | null;
  bankRef: string | null;
  payerAccount: string | null;
  bankName: string | null;
  cardSource: string | null;
  paidAmountMinor: number | null;
  paidCurrency: PaymentCurrency | null;
  providerCreatedAt: string | null;
  failedAt: string | null;
  detailsSyncedAt: string | null;
  providerOperations: ProviderOperation[];
  timeline: Array<{ kind: "created" | "provider_created" | "paid" | "failed" | "refund_pending" | "refund_completed" | "refund_failed"; at: string; amountMinor: number | null; actor: string | null; noteCode: string | null }>;
  refundableMinor: number;
  refundEligibility: { allowed: boolean; reason: string | null; windowEndsAt: string };
  refunds: PaymentRefund[];
};

export type RefundInput = { amountMinor: number; reason: string; idempotencyKey: string };
export type RefundResult = { refund: PaymentRefund; payment: PaymentDetail };

export type PaymentSort = "newest" | "oldest" | "amount_desc" | "amount_asc";
export type PaymentWindow = "7" | "30" | "90";

export type PaymentListParams = {
  page: number;
  pageSize: number;
  q?: string;
  status?: PaymentStatus;
  method?: string;
  currency?: PaymentCurrency;
  window?: PaymentWindow;
  sort?: PaymentSort;
};
export type PaymentListMeta = { page: number; pageSize: number; total: number; totalPages: number };
