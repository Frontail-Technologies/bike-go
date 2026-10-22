const DAY_MS = 24 * 60 * 60 * 1000;

export function rentalDays(pickupAt: Date, returnAt: Date) {
  const ms = returnAt.getTime() - pickupAt.getTime();
  if (!(ms > 0)) throw new RangeError("returnAt must be after pickupAt");
  return Math.max(1, Math.ceil(ms / DAY_MS));
}

export function periodsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

export function ageOn(dateOfBirth: string, today = new Date()) {
  const born = new Date(`${dateOfBirth}T00:00:00Z`);
  let age = today.getUTCFullYear() - born.getUTCFullYear();
  const beforeBirthday = today.getUTCMonth() < born.getUTCMonth() || (today.getUTCMonth() === born.getUTCMonth() && today.getUTCDate() < born.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}
