import { apiClient } from "@/lib/api/client";
import { unwrapData, type ApiEnvelope } from "@/lib/api/contracts";
import type { LoanTypeId } from "../lib/data";

export type LoanQuote = { currency: "USD"; interestRateBps: number; monthlyPaymentMinor: number; totalPaymentMinor: number; totalInterestMinor: number; minAmountMinor: number; maxAmountMinor: number; maxTenureMonths: number; allowedTenures: number[] };

export async function getLoanQuote(params: { loanType: LoanTypeId; amountMinor: number; tenureMonths: number }, signal?: AbortSignal) {
  const response = await apiClient.get<ApiEnvelope<LoanQuote>>("/loans/quote", { params, signal });
  return unwrapData(response.data);
}
