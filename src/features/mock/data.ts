export type BikeCategory = "cruiser" | "sports" | "adventure" | "touring" | "scooter";

export type Motorcycle = {
  id: string;
  name: string;
  brand: string;
  category: BikeCategory;
  pricePerDay: number;
  rating: number;
  reviews: number;
  engineCc: number;
  mileageKmpl: number;
  gears: number;
  weightKg: number;
  color: string;
  location: string;
};

export const motorcycles: Motorcycle[] = [
  { id: "re-classic-350", name: "Royal Enfield Classic 350", brand: "Royal Enfield", category: "cruiser", pricePerDay: 1200, rating: 4.8, reviews: 320, engineCc: 350, mileageKmpl: 35, gears: 5, weightKg: 195, color: "#FFC400", location: "Jaipur" },
  { id: "yamaha-mt-15", name: "Yamaha MT 15", brand: "Yamaha", category: "sports", pricePerDay: 1000, rating: 4.6, reviews: 210, engineCc: 155, mileageKmpl: 45, gears: 6, weightKg: 141, color: "#2563eb", location: "Jaipur" },
  { id: "ktm-duke-250", name: "KTM Duke 250", brand: "KTM", category: "sports", pricePerDay: 1500, rating: 4.7, reviews: 180, engineCc: 249, mileageKmpl: 30, gears: 6, weightKg: 168, color: "#f97316", location: "Udaipur" },
  { id: "honda-cb350", name: "Honda CB350", brand: "Honda", category: "cruiser", pricePerDay: 1300, rating: 4.5, reviews: 95, engineCc: 348, mileageKmpl: 35, gears: 5, weightKg: 181, color: "#9ca3af", location: "Jaipur" },
  { id: "tvs-apache-rtr-200", name: "TVS Apache RTR 200", brand: "TVS", category: "sports", pricePerDay: 1100, rating: 4.4, reviews: 120, engineCc: 197, mileageKmpl: 40, gears: 5, weightKg: 148, color: "#1d4ed8", location: "Jodhpur" },
  { id: "hero-xpulse-200", name: "Hero Xpulse 200", brand: "Hero", category: "adventure", pricePerDay: 1200, rating: 4.6, reviews: 88, engineCc: 199, mileageKmpl: 40, gears: 5, weightKg: 154, color: "#e5e7eb", location: "Udaipur" },
  { id: "re-himalayan", name: "Royal Enfield Himalayan", brand: "Royal Enfield", category: "adventure", pricePerDay: 1800, rating: 4.9, reviews: 410, engineCc: 411, mileageKmpl: 30, gears: 5, weightKg: 199, color: "#16a34a", location: "Jaipur" },
  { id: "honda-activa", name: "Honda Activa 6G", brand: "Honda", category: "scooter", pricePerDay: 500, rating: 4.3, reviews: 260, engineCc: 110, mileageKmpl: 50, gears: 0, weightKg: 107, color: "#ef4444", location: "Jaipur" },
];

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
