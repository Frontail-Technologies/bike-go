import { lt } from "drizzle-orm";
import { db } from "@/libs/db";
import { telegramLogins } from "@/libs/db/schema";

const SKEW_SECONDS = 60;

export async function claimTelegramLogin(hash: string, authDate: number, maxAgeSeconds: number) {
  const expiresAt = new Date((authDate + maxAgeSeconds + SKEW_SECONDS) * 1000);
  const [claimed] = await db.insert(telegramLogins).values({ hash: hash.toLowerCase(), expiresAt }).onConflictDoNothing().returning({ hash: telegramLogins.hash });
  if (claimed && Math.random() < 0.02) await db.delete(telegramLogins).where(lt(telegramLogins.expiresAt, new Date())).catch(() => undefined);
  return Boolean(claimed);
}
