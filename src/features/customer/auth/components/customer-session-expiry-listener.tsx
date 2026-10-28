"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CUSTOMER_SESSION_EXPIRED_EVENT } from "@/lib/api/client";
import { customerAuthKeys } from "../query-keys";

/** Keeps every customer feature in sync when the centralized Axios client receives a customer 401. */
export function CustomerSessionExpiryListener() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const expire = () => queryClient.setQueryData(customerAuthKeys.session(), null);
    window.addEventListener(CUSTOMER_SESSION_EXPIRED_EVENT, expire);
    return () => window.removeEventListener(CUSTOMER_SESSION_EXPIRED_EVENT, expire);
  }, [queryClient]);

  return null;
}
