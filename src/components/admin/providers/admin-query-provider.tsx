"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";
import { isApiError } from "@/lib/api/error";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Short enough that data is refetched on the next screen or tab focus (requests
        // revalidate by ETag, so unchanged data is a cheap 304), long enough to share one
        // request between components that mount together.
        staleTime: 5_000,
        gcTime: 10 * 60_000,
        retry: (failureCount, error) => failureCount < 1 && (!isApiError(error) || error.status === null || error.status >= 500),
        refetchOnWindowFocus: true,
      },
      mutations: { retry: false },
    },
  });
}

export function AdminQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
