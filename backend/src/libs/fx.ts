import { AppError } from "./api";
import { MINOR_EXPONENT } from "./money";
import type { Currency } from "./types";

const RATE_SCALE = 8;
const RATE_PATTERN = /^\d{1,12}(\.\d{1,8})?$/;

export function parseRate(rate: string) {
  if (!RATE_PATTERN.test(rate)) throw new RangeError(`Not a valid exchange rate: "${rate}"`);
  const [whole = "0", fraction = ""] = rate.split(".");
  const scaled = BigInt(whole + fraction.padEnd(RATE_SCALE, "0"));
  if (scaled <= 0n) throw new RangeError("An exchange rate must be greater than zero");
  return scaled;
}

export function convertMinor(amountMinor: number, from: Currency, to: Currency, rate: string) {
  if (!Number.isSafeInteger(amountMinor)) throw new RangeError("amountMinor must be an integer");
  const scaled = parseRate(rate);
  const numerator = BigInt(amountMinor) * scaled * 10n ** BigInt(MINOR_EXPONENT[to]);
  const denominator = 10n ** BigInt(RATE_SCALE) * 10n ** BigInt(MINOR_EXPONENT[from]);
  return Number((numerator * 2n + denominator) / (denominator * 2n));
}

export const noRateOnFile = (base: Currency, quote: Currency) =>
  new AppError("VALIDATION_ERROR", 422, `No ${base} to ${quote} exchange rate is on file, so amounts in ${quote} cannot be validated yet.`, [
    { path: "currency", message: `Not available until a ${base}/${quote} rate is recorded.` },
  ]);
