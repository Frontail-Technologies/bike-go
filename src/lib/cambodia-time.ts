const ICT_OFFSET = "+07:00";

export function cambodiaLocalIso(date: string, time = "00:00:00") {
  return `${date}T${time}${ICT_OFFSET}`;
}

export function cambodiaRentalRange(start: string, end: string) {
  return { pickupAt: cambodiaLocalIso(start, "10:00:00"), returnAt: cambodiaLocalIso(end, "10:00:00") };
}
