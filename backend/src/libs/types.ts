import type { auth } from "./auth";
import type { ERROR_CODES } from "./api";
import type { CURRENCIES } from "./money";

export type ErrorCode = (typeof ERROR_CODES)[number];

export type ErrorBody = {
  success: false;
  error: { code: ErrorCode; message: string; details: unknown };
  requestId: string;
};

export type Currency = (typeof CURRENCIES)[number];

export type Session = typeof auth.$Infer.Session;

export type Page = { page: number; pageSize: number; limit: number; offset: number };

export type PageParams = { page?: number | undefined; pageSize?: number | undefined };

export type Idempotent<T> = { status: number; body: T };

export type FxRate = { baseCurrency: Currency; quoteCurrency: Currency; rate: string; source: string; effectiveAt: Date };

export type TelegramLoginPayload = Record<string, string | number | boolean | null | undefined>;

export type TelegramIdentity = {
  telegramId: string;
  firstName: string;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
};

export type TelegramVerification = { ok: true; identity: TelegramIdentity } | { ok: false; reason: "missing_fields" | "bad_signature" | "expired" };
