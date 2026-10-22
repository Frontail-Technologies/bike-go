import { eq } from "drizzle-orm";
import { AppError } from "@/libs/api";
import { ageOn } from "@/libs/date";
import { db } from "@/libs/db";
import { account, customerProfiles, user } from "@/libs/db/schema";
import type { MePatch } from "./model";

/** Fields a customer must fill in before renting or applying. */
const REQUIRED_FOR_COMPLETION = ["fullName", "phone", "dateOfBirth", "nationality", "city"] as const;

export async function getMe(userId: string) {
  const [row] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (!row) throw new AppError("NOT_FOUND", 404, "User not found.");

  let [profile] = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, userId)).limit(1);
  if (!profile) {
    // Created lazily on first use, seeded from what the sign-in provider told us. A Telegram placeholder email is not real, so it is not copied.
    const email = row.email.endsWith("@users.ridego.invalid") ? null : row.email;
    [profile] = await db
      .insert(customerProfiles)
      .values({ userId, fullName: row.name, email, avatarUrl: row.image })
      .onConflictDoNothing()
      .returning();
    profile ??= (await db.select().from(customerProfiles).where(eq(customerProfiles.userId, userId)).limit(1))[0]!;
  }

  const accounts = await db.select({ providerId: account.providerId }).from(account).where(eq(account.userId, userId));
  const missingFields = REQUIRED_FOR_COMPLETION.filter((field) => !profile![field]);

  return {
    id: row.id,
    role: row.role,
    email: profile.email,
    fullName: profile.fullName,
    phone: profile.phone,
    telegramUsername: profile.telegramUsername,
    avatarUrl: profile.avatarUrl,
    dateOfBirth: profile.dateOfBirth,
    nationality: profile.nationality,
    address: profile.address,
    city: profile.city,
    providers: [...new Set(accounts.map((a) => a.providerId))],
    profileComplete: missingFields.length === 0,
    missingFields: [...missingFields],
  };
}

/** Updates only the whitelisted profile fields. Identity, email and role are never writable here. */
export async function updateMe(userId: string, patch: MePatch["Body"]) {
  if (patch.dateOfBirth !== undefined) {
    const parsed = new Date(`${patch.dateOfBirth}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== patch.dateOfBirth) {
      throw new AppError("VALIDATION_ERROR", 422, "Date of birth is not a real date.", [{ path: "dateOfBirth", message: "Not a real date." }]);
    }
    if (ageOn(patch.dateOfBirth) < 18) throw new AppError("VALIDATION_ERROR", 422, "You must be at least 18.", [{ path: "dateOfBirth", message: "Must be at least 18 years ago." }]);
  }

  await getMe(userId); // make sure the profile row exists
  const { fullName, phone, dateOfBirth, nationality, address, city } = patch;
  const changes = Object.fromEntries(Object.entries({ fullName, phone, dateOfBirth, nationality, address, city }).filter(([, value]) => value !== undefined));
  if (Object.keys(changes).length > 0) await db.update(customerProfiles).set(changes).where(eq(customerProfiles.userId, userId));
  return getMe(userId);
}
