"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";
import { isApiError } from "@/lib/api/error";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 10 * 60_000,
        retry: (failureCount, error) => failureCount < 1 && (!isApiError(error) || error.status === null || error.status >= 500),
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  });
}

export function AdminQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
