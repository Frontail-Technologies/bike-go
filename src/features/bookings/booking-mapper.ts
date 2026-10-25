import type { Motorcycle } from "@/features/vehicles/view-model";
import type { ApiBooking, ApiBookingStatus, BookingQuote, CustomerBooking } from "./types";
import type { Quote } from "./pricing";

const status = (value: ApiBookingStatus): CustomerBooking["status"] => {
  if (["pending", "confirmed", "ready_for_pickup"].includes(value)) return "upcoming";
  if (["active", "returned"].includes(value)) return "ongoing";
  if (value === "completed") return "completed";
  return "cancelled";
};

export function bookingQuoteToView(quote: BookingQuote): Quote {
  if (quote.currency !== "USD") throw new Error("RideGo customer pricing supports USD only.");
  const helmet = quote.addons.filter((item) => item.code === "helmet").reduce((sum, item) => sum + item.totalMinor, 0);
  const jacket = quote.addons.filter((item) => item.code === "riding-jacket").reduce((sum, item) => sum + item.totalMinor, 0);
  const taxable = quote.pricing.rentalSubtotalMinor + quote.pricing.addonsTotalMinor;
  return {
    days: quote.rentalDays,
    rental: quote.pricing.rentalSubtotalMinor / 100,
    helmet: helmet / 100,
    jacket: jacket / 100,
    addons: quote.addons.flatMap((item) => item.code ? [{ code: item.code, name: item.name, amount: item.totalMinor / 100 }] : []),
    tax: quote.pricing.taxesMinor / 100,
    fee: quote.pricing.platformFeeMinor / 100,
    deposit: quote.pricing.securityDepositMinor / 100,
    payable: quote.pricing.totalPayableMinor / 100,
    taxRate: taxable ? (quote.pricing.taxesMinor / taxable) * 100 : 0,
  };
}

export function apiBookingToView(value: ApiBooking): { booking: CustomerBooking; bike: Motorcycle } {
  if (value.currency !== "USD") throw new Error("RideGo customer pricing supports USD only.");
  const quote = bookingQuoteToView({ currency: value.currency, rentalDays: value.rentalDays, pricing: value.pricing, addons: value.addons });
  const booking: CustomerBooking = {
    reference: value.reference,
    bikeId: value.vehicle.slug,
    status: status(value.bookingStatus),
    startDate: value.pickupAt,
    endDate: value.returnAt,
    pickupTime: new Date(value.pickupAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Phnom_Penh" }),
    dropTime: new Date(value.returnAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Phnom_Penh" }),
    city: value.pickupLocation.city,
    addOns: Object.fromEntries(value.addons.flatMap((item) => item.code ? [[item.code, true]] : [])),
    quote,
    rider: { name: "", phone: "", email: "" },
    licenceNumber: null,
    paymentMethod: value.paymentStatus === "paid" ? "ABA PayWay" : "Payment pending",
    createdAt: value.createdAt,
    cancelledAt: value.cancelledAt ?? undefined,
  };
  const bike: Motorcycle = {
    id: value.vehicle.slug,
    name: value.vehicle.name,
    model: `${value.vehicle.brand} · ${value.vehicle.model}`,
    brand: value.vehicle.brand,
    category: "touring",
    pricePerDay: value.pricing.dailyRateMinor / 100,
    deposit: value.pricing.securityDepositMinor / 100,
    rating: 0, reviews: 0, engineCc: 0, powerBhp: 0, torqueNm: 0, mileageKmpl: 0, gears: 0, weightKg: 0, fuelTankL: 0,
    transmission: "manual", color: "#FFC400", colorways: ["#FFC400"], images: [], location: value.pickupLocation.city,
    description: "", highlights: [], available: true, bookedRanges: [],
  };
  return { booking, bike };
}
