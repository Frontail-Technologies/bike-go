"use client";

import { Spinner } from "@heroui/react";
import { TelegramLogoIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { TelegramLoginPayload } from "../types";

type TelegramLogin = {
  auth: (options: { bot_id: string; request_access?: "write"; lang?: string }, callback: (user: TelegramLoginPayload | false) => void) => void;
};

declare global {
  interface Window {
    Telegram?: { Login?: TelegramLogin };
  }
}

const SCRIPT_SRC = "https://telegram.org/js/telegram-widget.js?22";

function loadTelegramScript() {
  if (window.Telegram?.Login) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
  return new Promise<void>((resolve, reject) => {
    const script = existing ?? Object.assign(document.createElement("script"), { src: SCRIPT_SRC, async: true });
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Telegram sign-in could not be loaded.")), { once: true });
    if (!existing) document.head.append(script);
  });
}

export function TelegramLoginButton({
  label,
  isDisabled,
  isPending,
  onAuth,
  onError,
}: {
  label: string;
  isDisabled?: boolean;
  isPending?: boolean;
  onAuth: (payload: TelegramLoginPayload) => Promise<void> | void;
  onError: (error: unknown) => void;
}) {
  const botId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID;
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    if (botId) void loadTelegramScript().catch(() => undefined);
  }, [botId]);

  if (!botId) return null;

  async function signIn() {
    setPopupOpen(true);
    try {
      await loadTelegramScript();
      const login = window.Telegram?.Login;
      if (!login) throw new Error("Telegram sign-in could not be loaded.");
      const user = await new Promise<TelegramLoginPayload | false>((resolve) => login.auth({ bot_id: botId!, request_access: "write" }, resolve));
      if (user) await onAuth(user);
    } catch (error) {
      onError(error);
    } finally {
      setPopupOpen(false);
    }
  }

  const pending = popupOpen || Boolean(isPending);

  return (
    <Button
      size="lg"
      fullWidth
      className="bg-[#229ED9] text-white hover:bg-[#1e8fc4]"
      isPending={pending}
      isDisabled={isDisabled || pending}
      onPress={() => void signIn()}
    >
      {pending ? <Spinner color="current" size="sm" /> : <TelegramLogoIcon size={20} weight="fill" />}
      {label}
    </Button>
  );
}
