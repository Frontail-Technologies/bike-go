const ICT_OFFSET = "+07:00";

export function cambodiaLocalIso(date: string, time = "00:00:00") {
  return `${date}T${time}${ICT_OFFSET}`;
}

export function cambodiaRentalRange(start: string, end: string) {
  return { pickupAt: cambodiaLocalIso(start, "10:00:00"), returnAt: cambodiaLocalIso(end, "10:00:00") };
}

export function cambodiaRentalDateTime(date: string, displayTime: string) {
  const match = displayTime.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return cambodiaLocalIso(date, "10:00:00");
  let hour = Number(match[1]);
  const minute = match[2];
  const period = match[3].toUpperCase();
  if (period === "AM" && hour === 12) hour = 0;
  if (period === "PM" && hour !== 12) hour += 12;
  return cambodiaLocalIso(date, `${String(hour).padStart(2, "0")}:${minute}:00`);
}
