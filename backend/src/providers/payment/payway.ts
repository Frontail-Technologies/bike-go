import { createHmac } from "node:crypto";
import { AppError } from "@/libs/api";
import { MINOR_EXPONENT, toMinor } from "@/libs/money";
import type { Currency } from "@/libs/types";
import type {
  CheckoutForm,
  CheckoutInput,
  PaymentProvider,
  PaywayConfig,
  TransactionCheck,
} from "./types";

const CHECK_TIMEOUT_MS = 10_000;
const FAILED = new Set(["DECLINED", "CANCELLED", "EXPIRED", "FAILED"]);

const sign = (key: string, text: string) =>
  createHmac("sha512", key).update(text).digest("base64");

export function formatAmount(amountMinor: number, currency: Currency) {
  const exponent = MINOR_EXPONENT[currency];
  if (currency === "KHR") {
    if (amountMinor % 10 ** exponent !== 0)
      throw new AppError(
        "PAYMENT_UNAVAILABLE",
        422,
        "A riel payment must be a whole number of riel.",
      );
    return String(amountMinor / 10 ** exponent);
  }
  return (amountMinor / 10 ** exponent).toFixed(exponent);
}

const asCurrency = (value: unknown): Currency | null =>
  value === "USD" || value === "KHR" ? value : null;

function parseAmount(value: unknown, currency: Currency | null) {
  if (
    currency === null ||
    (typeof value !== "number" && typeof value !== "string")
  )
    return null;
  try {
    return toMinor(String(value), currency);
  } catch {
    return null;
  }
}

export class PaywayPaymentProvider implements PaymentProvider {
  readonly name = "payway";

  constructor(private readonly config: PaywayConfig) {}

  createCheckout(input: CheckoutInput): CheckoutForm {
    const { config } = this;
    const fields = {
      req_time: Math.floor(Date.now() / 1000).toString(),
      merchant_id: config.merchantId,
      tran_id: input.transactionId,
      amount: formatAmount(input.amountMinor, input.currency),
      items: "",
      shipping: "0",
      ctid: "",
      pwt: "",
      firstname: "",
      lastname: "",
      email: "",
      phone: "",
      type: "purchase",
      payment_option: config.paymentOption,
      return_url: Buffer.from(config.callbackUrl).toString("base64"),
      cancel_url: config.cancelUrl(input.bookingReference),
      continue_success_url: config.continueUrl(input.bookingReference),
      return_deeplink: "",
      currency: input.currency,
      custom_fields: "",
      return_params: "",
      payout: "",
      lifetime: "",
      additional_params: "",
      google_pay_token: "",
    };
    const hash = sign(config.apiKey, Object.values(fields).join(""));
    return {
      action: config.checkoutUrl,
      method: "POST",
      fields: { ...fields, hash },
    };
  }

  async checkTransaction(transactionId: string): Promise<TransactionCheck> {
    const { config } = this;
    const reqTime = Math.floor(Date.now() / 1000).toString();
    const body = {
      req_time: reqTime,
      merchant_id: config.merchantId,
      tran_id: transactionId,
      hash: sign(
        config.apiKey,
        `${reqTime}${config.merchantId}${transactionId}`,
      ),
    };

    let response: Response;
    try {
      response = await fetch(config.checkUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
      });
    } catch {
      throw new AppError(
        "PAYMENT_PROVIDER_ERROR",
        502,
        "The payment provider could not be reached. Try again shortly.",
      );
    }
    if (response.status >= 500)
      throw new AppError(
        "PAYMENT_PROVIDER_ERROR",
        502,
        "The payment provider is unavailable. Try again shortly.",
      );

    const raw = (await response.json().catch(() => null)) as {
      data?: Record<string, unknown>;
      status?: { code?: unknown };
    } | null;
    const data = raw?.data;
    const status =
      typeof data?.payment_status === "string"
        ? data.payment_status.toUpperCase()
        : null;

    if (status === "APPROVED") {
      const currency = asCurrency(
        data?.original_currency ?? data?.payment_currency,
      );
      return {
        state: "approved",
        amountMinor: parseAmount(
          data?.original_amount ?? data?.total_amount,
          currency,
        ),
        currency,
        raw,
      };
    }
    if (status !== null && FAILED.has(status)) return { state: "failed", raw };
    return { state: "pending" };
  }
}
