import { eq } from "drizzle-orm";
import { AppError, invalid } from "@/libs/api";
import { ageOn, isRealDate } from "@/libs/date";
import { db } from "@/libs/db";
import { account, customerProfiles, user } from "@/libs/db/schema";
import type { MePatch } from "./types";
import { compact } from "@/libs/object";
import { publicEmail } from "@/libs/identity";

const REQUIRED_FOR_COMPLETION = ["fullName", "phone", "dateOfBirth", "nationality", "city"] as const;

export async function getMe(userId: string) {
  const [row] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (!row) throw new AppError("NOT_FOUND", 404, "User not found.");

  let [profile] = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, userId)).limit(1);
  if (!profile) {
    const email = publicEmail(row.email);
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

export async function updateMe(userId: string, patch: MePatch["Body"]) {
  if (patch.dateOfBirth !== undefined) {
    if (!isRealDate(patch.dateOfBirth)) throw invalid("dateOfBirth", "Date of birth is not a real date.", "Not a real date.");
    if (ageOn(patch.dateOfBirth) < 18) throw invalid("dateOfBirth", "You must be at least 18.", "Must be at least 18 years ago.");
  }

  await getMe(userId);
  const { fullName, phone, dateOfBirth, nationality, address, city } = patch;
  const changes = compact({ fullName, phone, dateOfBirth, nationality, address, city });
  if (Object.keys(changes).length > 0) await db.update(customerProfiles).set(changes).where(eq(customerProfiles.userId, userId));
  return getMe(userId);
}
