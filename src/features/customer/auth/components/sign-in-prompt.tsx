"use client";

import { SignInIcon } from "@phosphor-icons/react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { useTranslations } from "@/i18n/hooks";
import { useCustomerSessionQuery } from "../hooks/use-customer-session-query";
import { safeCustomerReturnTo } from "../lib/safe-return-to";

const PROTECTED = [/^\/bookings(\/|$)/, /^\/profile(\/|$)/, /^\/notifications(\/|$)/, /^\/help\/report(\/|$)/, /^\/loans\/[^/]+(\/|$)/, /^\/bikes\/.+\/book(\/|$)/];

export function requiresSignIn(path: string) {
  return PROTECTED.some((pattern) => pattern.test(path));
}

let promptReturnTo: string | null = null;
const listeners = new Set<() => void>();
const setPrompt = (returnTo: string | null) => {
  promptReturnTo = returnTo;
  listeners.forEach((listener) => listener());
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function openSignInPrompt(returnTo: string) {
  setPrompt(returnTo);
}

export function useRequireSignIn() {
  const session = useCustomerSessionQuery();
  const signedOut = !session.isPending && !session.data;
  return useCallback((returnTo: string) => {
    if (!signedOut) return true;
    openSignInPrompt(returnTo);
    return false;
  }, [signedOut]);
}

export function SignInPrompt() {
  const returnTo = useSyncExternalStore(subscribe, () => promptReturnTo, () => null);
  const session = useCustomerSessionQuery();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("auth");
  const signedOut = !session.isPending && !session.data;

  useEffect(() => setPrompt(null), [pathname]);

  useEffect(() => {
    if (!signedOut) return;
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank") return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || !requiresSignIn(url.pathname)) return;
      event.preventDefault();
      event.stopPropagation();
      openSignInPrompt(`${url.pathname}${url.search}`);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [signedOut]);

  const close = () => setPrompt(null);

  return (
    <ModalDialog
      isOpen={returnTo !== null}
      onOpenChange={(open) => !open && close()}
      title={t("promptTitle")}
      footer={
        <>
          <Button variant="secondary" slot="close">{t("promptLater")}</Button>
          <Button
            onPress={() => {
              const target = safeCustomerReturnTo(returnTo);
              router.replace(`/signin?returnTo=${encodeURIComponent(target)}`);
            }}
          >
            <SignInIcon size={20} />
            {t("signIn")}
          </Button>
        </>
      }
    >
      <p className="text-sm text-subtle">{t("promptBody")}</p>
    </ModalDialog>
  );
}
