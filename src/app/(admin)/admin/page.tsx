import { CalendarCheckIcon, CurrencyInrIcon, MotorcycleIcon, UsersIcon } from "@phosphor-icons/react/ssr";
import { DashboardStatCard } from "@/components/admin/dashboard-stat-card";
import { RecentBookings } from "@/components/admin/recent-bookings";
import { dashboardStats } from "@/features/mock/data";

const icons = {
  revenue: <CurrencyInrIcon size={20} />,
  bookings: <CalendarCheckIcon size={20} />,
  active: <MotorcycleIcon size={20} />,
  customers: <UsersIcon size={20} />,
} as const;

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4 md:gap-4">
        {dashboardStats.map((stat) => (
          <DashboardStatCard key={stat.id} {...stat} icon={icons[stat.id as keyof typeof icons]} />
        ))}
      </div>
      <RecentBookings />
    </div>
  );
}
