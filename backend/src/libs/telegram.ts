import { createHash } from "node:crypto";
import { hmacSha256Hex, safeEqual } from "./hash";

export type TelegramLoginPayload = Record<string, string | number | boolean | null | undefined>;

export type TelegramIdentity = {
  telegramId: string;
  firstName: string;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
};

export type TelegramVerification = { ok: true; identity: TelegramIdentity } | { ok: false; reason: "missing_fields" | "bad_signature" | "expired" };

const FUTURE_SKEW_SECONDS = 60;

export function verifyTelegramLogin(
  payload: TelegramLoginPayload,
  options: { botToken: string; maxAgeSeconds: number; now?: Date },
): TelegramVerification {
  const { hash, ...fields } = payload;
  if (typeof hash !== "string" || fields.id === undefined || fields.auth_date === undefined) return { ok: false, reason: "missing_fields" };

  const dataCheckString = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join("\n");

  const secret = createHash("sha256").update(options.botToken).digest();
  const expected = hmacSha256Hex(secret, dataCheckString);
  if (!safeEqual(expected, hash.toLowerCase())) return { ok: false, reason: "bad_signature" };

  const nowSeconds = Math.floor((options.now ?? new Date()).getTime() / 1000);
  const authDate = Number(fields.auth_date);
  if (!Number.isFinite(authDate) || nowSeconds - authDate > options.maxAgeSeconds || authDate - nowSeconds > FUTURE_SKEW_SECONDS) return { ok: false, reason: "expired" };

  const text = (value: unknown) => (typeof value === "string" && value.length > 0 ? value : null);
  return {
    ok: true,
    identity: {
      telegramId: String(fields.id),
      firstName: text(fields.first_name) ?? "Telegram user",
      lastName: text(fields.last_name),
      username: text(fields.username),
      photoUrl: text(fields.photo_url),
    },
  };
}

export function signTelegramLogin(fields: Record<string, string | number>, botToken: string) {
  const dataCheckString = Object.entries(fields)
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join("\n");
  const secret = createHash("sha256").update(botToken).digest();
  return { ...fields, hash: hmacSha256Hex(secret, dataCheckString) };
}
