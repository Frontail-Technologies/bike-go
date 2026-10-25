"use client";

import { useEffect, useRef } from "react";
import type { TelegramLoginPayload } from "../types";

declare global {
  interface Window {
    __ridegoTelegramAuth?: (payload: TelegramLoginPayload) => void;
  }
}

export function TelegramLoginWidget({ onAuth }: { onAuth: (payload: TelegramLoginPayload) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const callback = useRef(onAuth);
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  useEffect(() => {
    callback.current = onAuth;
  }, [onAuth]);

  useEffect(() => {
    if (!host.current || !botUsername) return;
    window.__ridegoTelegramAuth = (payload) => callback.current(payload);
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botUsername.replace(/^@/, ""));
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "12");
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "window.__ridegoTelegramAuth(user)");
    host.current.replaceChildren(script);
    return () => {
      delete window.__ridegoTelegramAuth;
      host.current?.replaceChildren();
    };
  }, [botUsername]);

  if (!botUsername) return <p className="text-center text-xs text-white/60">Telegram sign-in is not configured.</p>;
  return <div ref={host} className="flex min-h-10 justify-center" aria-label="Continue with Telegram" />;
}
