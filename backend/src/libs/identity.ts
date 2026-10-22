export const TELEGRAM_EMAIL_DOMAIN = "users.ridego.invalid";

export const placeholderEmail = (telegramId: string) => `telegram-${telegramId}@${TELEGRAM_EMAIL_DOMAIN}`;

export const isPlaceholderEmail = (email: string) => email.endsWith(`@${TELEGRAM_EMAIL_DOMAIN}`);

export function publicEmail(...candidates: (string | null | undefined)[]) {
  return candidates.find((email): email is string => Boolean(email) && !isPlaceholderEmail(email!)) ?? null;
}
