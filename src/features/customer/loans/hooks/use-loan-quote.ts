"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getLoanQuote } from "../api/loan-quote-api";
import type { LoanTypeId } from "../lib/data";

export function useLoanQuote(params: { loanType: LoanTypeId; amount: number; tenureMonths: number }) {
  const request = { loanType: params.loanType, amountMinor: Math.round(params.amount * 100), tenureMonths: params.tenureMonths };
  return useQuery({
    queryKey: ["customer", "loans", "quote", request],
    queryFn: ({ signal }) => getLoanQuote(request, signal),
    enabled: request.amountMinor > 0 && request.tenureMonths > 0,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
