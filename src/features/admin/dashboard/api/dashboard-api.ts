import { apiClient } from "@/lib/api/client";
import type { DashboardOverview, DashboardRange } from "../types/dashboard";

export const dashboardApi = {
  overview: (range: DashboardRange) => apiClient.get<{ data: DashboardOverview }>("/admin/dashboard", { params: { range } }).then((response) => response.data.data),
};
