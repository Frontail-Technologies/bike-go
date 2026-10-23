export type FaqId =
  | "how-to-book"
  | "change-dates"
  | "cancel"
  | "extend"
  | "what-i-pay"
  | "deposit"
  | "methods"
  | "documents"
  | "late"
  | "other-city"
  | "helmet"
  | "breakdown"
  | "km-limit";

export type FaqGroup = {
  id: "booking" | "payments" | "pickup" | "riding";
  title: "groupBooking" | "groupPayments" | "groupPickup" | "groupRiding";
  items: FaqId[];
};

export const faqGroups: FaqGroup[] = [
  { id: "booking", title: "groupBooking", items: ["how-to-book", "change-dates", "cancel", "extend"] },
  { id: "payments", title: "groupPayments", items: ["what-i-pay", "deposit", "methods"] },
  { id: "pickup", title: "groupPickup", items: ["documents", "late", "other-city"] },
  { id: "riding", title: "groupRiding", items: ["helmet", "breakdown", "km-limit"] },
];

export const popularFaqIds: FaqId[] = ["how-to-book", "cancel", "deposit", "documents"];

type Snake<S extends string> = S extends `${infer A}-${infer B}` ? `${A}_${Snake<B>}` : S;

export const faqKey = <I extends FaqId, K extends "q" | "a">(id: I, kind: K) => `${kind}_${id.replaceAll("-", "_")}` as `${K}_${Snake<I>}`;
