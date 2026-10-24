export type SystemRules = {
  vatRateBps: number;
  platformFeeUsdMinor: number;
  bookingHoldMinutes: number;
  timezone: string;
  uploadLimits: { documentMaxBytes: number; imageMaxBytes: number };
  paymentProvider: { enabled: boolean; name: string | null };
};
