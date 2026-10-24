import { apiClient } from "@/lib/api/client";
import type { SystemRules } from "../types/system-rules";

export const systemRulesApi = {
  get: () => apiClient.get<{ data: SystemRules }>("/admin/system-rules").then((response) => response.data.data),
};
