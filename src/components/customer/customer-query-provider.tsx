"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { isApiError } from "@/lib/api/error";

function createCustomerQueryClient() {
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

export function CustomerQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createCustomerQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
