export type BikeCategory = "cruiser" | "sports" | "adventure" | "touring" | "scooter";
export type Transmission = "manual" | "automatic";

export type Motorcycle = {
  id: string;
  name: string;
  model: string;
  brand: string;
  category: BikeCategory;
  pricePerDay: number;
  /** Refundable security deposit in INR. */
  deposit: number;
  rating: number;
  reviews: number;
  engineCc: number;
  powerBhp: number;
  torqueNm: number;
  mileageKmpl: number;
  gears: number;
  weightKg: number;
  fuelTankL: number;
  transmission: Transmission;
  /** Primary colour; also tints the placeholder artwork. */
  color: string;
  /** One colourway per gallery slide while real photography is missing. */
  colorways: string[];
  /** Real photos, e.g. `/bikes/<id>/1.webp`. Empty until assets exist; BikeImage falls back to artwork. */
  images: string[];
  /** Home city. Every bike can be collected from any hub. */
  location: string;
  description: string;
  highlights: string[];
  /** Currently rentable. When false, `availableFrom` says when it returns. */
  available: boolean;
  availableFrom?: string;
  /** Inclusive ISO date ranges that are already booked. */
  bookedRanges: [string, string][];
};

type BikeInput = Omit<Motorcycle, "color" | "images"> & { images?: string[] };

const defineBike = (input: BikeInput): Motorcycle => ({
  ...input,
  color: input.colorways[0],
  images: input.images ?? [],
});

export const motorcycles: Motorcycle[] = [
  defineBike({
    id: "royal-enfield-classic-350",
    name: "Royal Enfield Classic 350",
    model: "Classic 350 · 2025",
    brand: "Royal Enfield",
    category: "cruiser",
    pricePerDay: 1200,
    deposit: 3000,
    rating: 4.8,
    reviews: 320,
    engineCc: 349,
    powerBhp: 20.2,
    torqueNm: 27,
    mileageKmpl: 35,
    gears: 5,
    weightKg: 195,
    fuelTankL: 13,
    transmission: "manual",
    colorways: ["#FFC400", "#1f2937", "#9ca3af", "#7c2d12"],
    location: "Jaipur",
    description: "The easy-going classic. Comfortable seat, the thump you expect, and enough torque for city streets and highway days alike.",
    highlights: ["Dual-channel ABS", "Comfortable upright seat", "Great for couples"],
    available: true,
    bookedRanges: [["2026-10-28", "2026-10-29"]],
  }),
  defineBike({
    id: "royal-enfield-hunter-350",
    name: "Royal Enfield Hunter 350",
    model: "Hunter 350 · 2025",
    brand: "Royal Enfield",
    category: "cruiser",
    pricePerDay: 1000,
    deposit: 3000,
    rating: 4.7,
    reviews: 214,
    engineCc: 349,
    powerBhp: 20.2,
    torqueNm: 27,
    mileageKmpl: 36,
    gears: 5,
    weightKg: 177,
    fuelTankL: 13,
    transmission: "manual",
    colorways: ["#2563eb", "#e5e7eb", "#111111"],
    location: "Jaipur",
    description: "A lighter, sharper roadster from the same family. Easy to turn, easy to park and fun in traffic.",
    highlights: ["Lightest in the 350 range", "Nimble in the city", "Disc brakes both ends"],
    available: true,
    bookedRanges: [["2026-10-24", "2026-10-26"]],
  }),
  defineBike({
    id: "honda-cb350",
    name: "Honda CB350",
    model: "CB350 H'ness · 2025",
    brand: "Honda",
    category: "cruiser",
    pricePerDay: 1300,
    deposit: 3500,
    rating: 4.5,
    reviews: 95,
    engineCc: 348,
    powerBhp: 20.8,
    torqueNm: 30,
    mileageKmpl: 35,
    gears: 5,
    weightKg: 181,
    fuelTankL: 15,
    transmission: "manual",
    colorways: ["#9ca3af", "#1d4ed8", "#111111"],
    location: "Jodhpur",
    description: "Smooth, refined and quiet for a retro. A relaxed ride with traction control and a big tank.",
    highlights: ["Honda Selectable Torque Control", "Refined engine", "15L tank"],
    available: true,
    bookedRanges: [],
  }),
  defineBike({
    id: "yamaha-mt-15",
    name: "Yamaha MT-15",
    model: "MT-15 V2 · 2025",
    brand: "Yamaha",
    category: "sports",
    pricePerDay: 1000,
    deposit: 3000,
    rating: 4.6,
    reviews: 210,
    engineCc: 155,
    powerBhp: 18.4,
    torqueNm: 14,
    mileageKmpl: 45,
    gears: 6,
    weightKg: 141,
    fuelTankL: 10,
    transmission: "manual",
    colorways: ["#2563eb", "#111111", "#ef4444"],
    location: "Jaipur",
    description: "Naked street fighter with a sharp stance and a rev-happy engine. Light, quick and great fun on twisty roads.",
    highlights: ["Slipper clutch", "Upside-down forks", "Under 145 kg"],
    available: true,
    bookedRanges: [],
  }),
  defineBike({
    id: "ktm-duke-200",
    name: "KTM Duke 200",
    model: "Duke 200 · 2025",
    brand: "KTM",
    category: "sports",
    pricePerDay: 1100,
    deposit: 3500,
    rating: 4.7,
    reviews: 180,
    engineCc: 199,
    powerBhp: 24.1,
    torqueNm: 19.3,
    mileageKmpl: 35,
    gears: 6,
    weightKg: 159,
    fuelTankL: 13.4,
    transmission: "manual",
    colorways: ["#f97316", "#111111", "#e5e7eb"],
    location: "Udaipur",
    description: "Punchy single-cylinder power in a flickable chassis. The quickest way through a city.",
    highlights: ["24 bhp from 200cc", "Digital cluster", "Dual-channel ABS"],
    available: true,
    bookedRanges: [["2026-10-30", "2026-11-01"]],
  }),
  defineBike({
    id: "tvs-apache-rtr-200",
    name: "TVS Apache RTR 200",
    model: "Apache RTR 200 4V · 2025",
    brand: "TVS",
    category: "sports",
    pricePerDay: 900,
    deposit: 2500,
    rating: 4.4,
    reviews: 120,
    engineCc: 197,
    powerBhp: 20.8,
    torqueNm: 17.3,
    mileageKmpl: 40,
    gears: 5,
    weightKg: 152,
    fuelTankL: 12,
    transmission: "manual",
    colorways: ["#1d4ed8", "#111111", "#ef4444"],
    location: "Jodhpur",
    description: "Track-inspired and good value. Strong brakes, a firm chassis and an easy-to-live-with engine.",
    highlights: ["Ride modes", "Good value per day", "Bluetooth connectivity"],
    available: false,
    availableFrom: "2026-10-27",
    bookedRanges: [["2026-10-22", "2026-10-26"]],
  }),
  defineBike({
    id: "royal-enfield-himalayan",
    name: "Royal Enfield Himalayan",
    model: "Himalayan 411 · 2024",
    brand: "Royal Enfield",
    category: "adventure",
    pricePerDay: 1800,
    deposit: 5000,
    rating: 4.9,
    reviews: 410,
    engineCc: 411,
    powerBhp: 24.3,
    torqueNm: 32,
    mileageKmpl: 30,
    gears: 5,
    weightKg: 199,
    fuelTankL: 15,
    transmission: "manual",
    colorways: ["#16a34a", "#e5e7eb", "#9ca3af"],
    location: "Jaipur",
    description: "Built for long roads and rough ones. Long-travel suspension and a relaxed engine make it a proper touring partner.",
    highlights: ["220 mm ground clearance", "Luggage-ready", "Switchable ABS"],
    available: true,
    bookedRanges: [["2026-11-05", "2026-11-09"]],
  }),
  defineBike({
    id: "hero-xpulse-200",
    name: "Hero Xpulse 200",
    model: "Xpulse 200 4V · 2025",
    brand: "Hero",
    category: "adventure",
    pricePerDay: 1200,
    deposit: 3000,
    rating: 4.6,
    reviews: 88,
    engineCc: 199,
    powerBhp: 19,
    torqueNm: 17.3,
    mileageKmpl: 40,
    gears: 5,
    weightKg: 154,
    fuelTankL: 13,
    transmission: "manual",
    colorways: ["#e5e7eb", "#f97316", "#111111"],
    location: "Udaipur",
    description: "Light and capable off the tarmac. Tall suspension and a forgiving engine make rough roads easy.",
    highlights: ["Long-travel suspension", "Lightweight", "Easy off-road"],
    available: true,
    bookedRanges: [],
  }),
  defineBike({
    id: "royal-enfield-super-meteor-650",
    name: "Royal Enfield Super Meteor 650",
    model: "Super Meteor 650 · 2025",
    brand: "Royal Enfield",
    category: "touring",
    pricePerDay: 2200,
    deposit: 6000,
    rating: 4.8,
    reviews: 140,
    engineCc: 648,
    powerBhp: 46.4,
    torqueNm: 52.3,
    mileageKmpl: 25,
    gears: 6,
    weightKg: 241,
    fuelTankL: 15.7,
    transmission: "manual",
    colorways: ["#111111", "#7c2d12", "#2563eb"],
    location: "Jaipur",
    description: "A big, smooth twin made for the highway. Low seat, wide bars and effortless pull at any speed.",
    highlights: ["Parallel twin", "Tripper navigation", "Long-distance comfort"],
    available: true,
    bookedRanges: [["2026-10-25", "2026-10-27"]],
  }),
  defineBike({
    id: "honda-activa-6g",
    name: "Honda Activa 6G",
    model: "Activa 6G · 2025",
    brand: "Honda",
    category: "scooter",
    pricePerDay: 500,
    deposit: 1500,
    rating: 4.3,
    reviews: 260,
    engineCc: 110,
    powerBhp: 7.7,
    torqueNm: 8.8,
    mileageKmpl: 50,
    gears: 0,
    weightKg: 107,
    fuelTankL: 5.3,
    transmission: "automatic",
    colorways: ["#ef4444", "#9ca3af", "#111111"],
    location: "Jaipur",
    description: "The easiest way around town. Twist and go, with storage under the seat and great mileage.",
    highlights: ["No gears to learn", "Under-seat storage", "Best mileage"],
    available: true,
    bookedRanges: [],
  }),
];

export function getBike(id: string) {
  return motorcycles.find((bike) => bike.id === id);
}

export const categories: { id: BikeCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "cruiser", label: "Cruiser" },
  { id: "sports", label: "Sports" },
  { id: "adventure", label: "Adventure" },
  { id: "touring", label: "Touring" },
  { id: "scooter", label: "Scooter" },
];

export const brands = [...new Set(motorcycles.map((bike) => bike.brand))].sort();

export const cities = ["Jaipur", "Udaipur", "Jodhpur"] as const;
export type City = (typeof cities)[number];

export const pickupHubs: Record<City, { name: string; address: string; hours: string }> = {
  Jaipur: { name: "RideGo C-Scheme Hub", address: "12 Ashok Marg, C-Scheme, Jaipur 302001", hours: "7 AM – 9 PM" },
  Udaipur: { name: "RideGo Fatehsagar Hub", address: "5 Lake Road, near Fatehsagar, Udaipur 313001", hours: "7 AM – 9 PM" },
  Jodhpur: { name: "RideGo Clock Tower Hub", address: "8 Sardar Market Road, Jodhpur 342001", hours: "7 AM – 9 PM" },
};

// ---------------------------------------------------------------- Admin-facing sample data (Phase 1)

export type BookingStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

export type Booking = {
  id: string;
  reference: string;
  customer: string;
  bike: string;
  startDate: string;
  endDate: string;
  total: number;
  status: BookingStatus;
  location: string;
};

const customers = ["Rahul Sharma", "Ananya Singh", "Vikram Rathore", "Meera Joshi", "Arjun Mehta", "Priya Nair", "Karan Malhotra", "Sneha Kapoor", "Rohan Verma", "Isha Gupta", "Dev Patel", "Neha Choudhary"];
const statuses: BookingStatus[] = ["upcoming", "ongoing", "completed", "cancelled", "completed", "upcoming"];

export const bookings: Booking[] = customers.map((customer, i) => {
  const bike = motorcycles[i % motorcycles.length];
  const days = (i % 4) + 1;
  const start = new Date(2026, 9, 20 + i);
  const end = new Date(start);
  end.setDate(start.getDate() + days);
  return {
    id: `bk-${i + 1}`,
    reference: `RG${820461 + i * 37}`,
    customer,
    bike: bike.name,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    total: bike.pricePerDay * days,
    status: statuses[i % statuses.length],
    location: bike.location,
  };
});

export const dashboardStats = [
  { id: "revenue", label: "Revenue", value: 482300, format: "currency" as const, delta: 12.4, trend: "up" as const },
  { id: "bookings", label: "Bookings", value: 1284, format: "number" as const, delta: 8.1, trend: "up" as const },
  { id: "active", label: "Bikes on rent", value: 46, format: "number" as const, delta: 2.3, trend: "down" as const },
  { id: "customers", label: "New customers", value: 312, format: "number" as const, delta: 5.6, trend: "up" as const },
];

export const timeSlots = ["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "06:00 PM"].map(
  (label) => ({ id: label, label }),
);
