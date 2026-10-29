"use client";

import { useEffect, useEffectEvent } from "react";
import { CUSTOMER_SESSION_EXPIRED_EVENT } from "@/lib/api/client";
import { useClearCustomerSession } from "../hooks/use-customer-session-query";

export function CustomerSessionExpiryListener() {
  const expire = useEffectEvent(useClearCustomerSession());

  useEffect(() => {
    window.addEventListener(CUSTOMER_SESSION_EXPIRED_EVENT, expire);
    return () => window.removeEventListener(CUSTOMER_SESSION_EXPIRED_EVENT, expire);
  }, []);

  return null;
}
