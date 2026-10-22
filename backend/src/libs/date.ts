const DAY_MS = 24 * 60 * 60 * 1000;

/** Rental days are 24-hour blocks, rounded up: 25 hours bills as 2 days, anything under 24 hours as 1. */
export function rentalDays(pickupAt: Date, returnAt: Date) {
  const ms = returnAt.getTime() - pickupAt.getTime();
  if (!(ms > 0)) throw new RangeError("returnAt must be after pickupAt");
  return Math.max(1, Math.ceil(ms / DAY_MS));
}

/** Two half-open periods [aStart, aEnd) and [bStart, bEnd) overlap. Back-to-back periods do not. */
export function periodsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

/** Whole years between a YYYY-MM-DD date of birth and a reference day. */
export function ageOn(dateOfBirth: string, today = new Date()) {
  const born = new Date(`${dateOfBirth}T00:00:00Z`);
  let age = today.getUTCFullYear() - born.getUTCFullYear();
  const beforeBirthday = today.getUTCMonth() < born.getUTCMonth() || (today.getUTCMonth() === born.getUTCMonth() && today.getUTCDate() < born.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}
