import { addMinor, multiplyMinor, percentOfMinor } from "@/libs/money";
import type { PricingInput, PricingResult } from "./types";

export function priceBooking(input: PricingInput): PricingResult {
  const rentalSubtotalMinor = multiplyMinor(input.dailyRateMinor, input.days);
  const addons = input.addons.map((addon) => ({ ...addon, days: input.days, totalMinor: multiplyMinor(multiplyMinor(addon.unitPriceMinor, addon.quantity), input.days) }));
  const addonsTotalMinor = addMinor(0, ...addons.map((a) => a.totalMinor));
  const taxesMinor = percentOfMinor(addMinor(rentalSubtotalMinor, addonsTotalMinor), input.taxRateBps);

  return {
    currency: input.currency,
    days: input.days,
    dailyRateMinor: input.dailyRateMinor,
    rentalSubtotalMinor,
    addons,
    addonsTotalMinor,
    platformFeeMinor: input.platformFeeMinor,
    taxesMinor,
    securityDepositMinor: input.securityDepositMinor,
    totalPayableMinor: addMinor(rentalSubtotalMinor, addonsTotalMinor, input.platformFeeMinor, taxesMinor, input.securityDepositMinor),
  };
}
