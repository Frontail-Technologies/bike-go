"use client";

import { CheckCircleIcon, ClockIcon, MotorcycleIcon, XCircleIcon } from "@phosphor-icons/react";
import { StatusBadge, type BadgeTone } from "@/components/ui/status-badge";
import type { BookingStatus } from "@/features/bookings/types";
import { useTranslations } from "@/i18n/hooks";

const config: Record<BookingStatus, { key: "statusUpcoming" | "statusOngoing" | "statusCompleted" | "statusCancelled"; tone: BadgeTone; icon: React.ReactNode }> = {
  upcoming: { key: "statusUpcoming", tone: "info", icon: <ClockIcon size={14} weight="bold" /> },
  ongoing: { key: "statusOngoing", tone: "brand", icon: <MotorcycleIcon size={14} weight="bold" /> },
  completed: { key: "statusCompleted", tone: "success", icon: <CheckCircleIcon size={14} weight="bold" /> },
  cancelled: { key: "statusCancelled", tone: "danger", icon: <XCircleIcon size={14} weight="bold" /> },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const t = useTranslations("booking");
  const { key, tone, icon } = config[status];
  return (
    <StatusBadge tone={tone} icon={icon}>
      {t(key)}
    </StatusBadge>
  );
}
