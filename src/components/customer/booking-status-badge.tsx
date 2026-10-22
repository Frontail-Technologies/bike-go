import { CheckCircleIcon, ClockIcon, MotorcycleIcon, XCircleIcon } from "@phosphor-icons/react";
import { StatusBadge, type BadgeTone } from "@/components/ui/status-badge";
import type { BookingStatus } from "@/features/mock/data";

const config: Record<BookingStatus, { label: string; tone: BadgeTone; icon: React.ReactNode }> = {
  upcoming: { label: "Upcoming", tone: "info", icon: <ClockIcon size={14} weight="bold" /> },
  ongoing: { label: "On rent", tone: "brand", icon: <MotorcycleIcon size={14} weight="bold" /> },
  completed: { label: "Completed", tone: "success", icon: <CheckCircleIcon size={14} weight="bold" /> },
  cancelled: { label: "Cancelled", tone: "danger", icon: <XCircleIcon size={14} weight="bold" /> },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const { label, tone, icon } = config[status];
  return (
    <StatusBadge tone={tone} icon={icon}>
      {label}
    </StatusBadge>
  );
}
