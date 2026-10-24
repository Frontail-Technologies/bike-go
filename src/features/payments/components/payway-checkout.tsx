"use client";

import { Alert } from "@heroui/react";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/error";
import type { StartedPayment } from "../api/checkout-api";
import { useBookingPayment, useStartPayment } from "../hooks/use-checkout";

declare global {
  interface Window {
    AbaPayway?: { checkout: () => void };
  }
}

const money = (minor: number, currency: string) => new Intl.NumberFormat("en-US", { style: "currency", currency }).format(minor / 100);

/**
 * Pays a pending booking through ABA PayWay's hosted checkout (ABA Pay, KHQR and the other methods the merchant account enables).
 * The signed form comes from the backend; the browser never holds the signing key and success is only ever read back from the server.
 */
export function PaywayCheckout({ reference, onPaid }: { reference: string; onPaid?: () => void }) {
  const start = useStartPayment(reference);
  const formRef = useRef<HTMLFormElement>(null);
  const [payment, setPayment] = useState<StartedPayment | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const opened = useRef(false);
  const status = useBookingPayment(reference, payment !== null);
  const attempt = status.data?.attempt;
  const state = attempt?.status ?? (payment ? "pending" : "idle");
  const expired = status.data?.bookingStatus === "expired";

  // Open PayWay's checkout once the signed form is in the page and its script has loaded.
  useEffect(() => {
    if (payment && scriptReady && !opened.current && window.AbaPayway) {
      window.AbaPayway.checkout();
      opened.current = true;
    }
  }, [payment, scriptReady]);

  useEffect(() => {
    if (state === "paid") onPaid?.();
  }, [state, onPaid]);

  async function pay() {
    opened.current = false;
    setPayment(await start.mutateAsync());
  }

  const scriptUrl = payment ? `${new URL(payment.checkout.action).origin}/plugins/checkout2-0.js` : null;

  return (
    <section aria-label="Payment" className="flex flex-col gap-3">
      {payment ? (
        <>
          <dl className="flex items-baseline justify-between gap-3 text-sm">
            <dt className="text-subtle">Booking {reference}</dt>
            <dd className="text-lg font-extrabold">{money(payment.amountMinor, payment.currency)}</dd>
          </dl>
          {scriptUrl ? <Script src={scriptUrl} strategy="afterInteractive" onLoad={() => setScriptReady(true)} onReady={() => setScriptReady(true)} /> : null}
          <form ref={formRef} id="aba_merchant_request" method="POST" target="aba_webservice" action={payment.checkout.action} className="hidden">
            {Object.entries(payment.checkout.fields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
          </form>
        </>
      ) : null}

      {state === "pending" && payment && !expired ? (
        <div role="status" aria-live="polite" className="rounded-xl bg-surface-secondary p-3 text-sm">
          Waiting for your payment. Scan the KHQR or approve it in ABA Mobile; this page updates by itself once it is confirmed.
          <Button variant="outline" className="mt-3 min-h-11 w-full" onPress={() => window.AbaPayway?.checkout()}>Open payment window again</Button>
        </div>
      ) : null}
      {state === "paid" ? <Alert status="success"><Alert.Indicator /><Alert.Content><Alert.Title>Payment confirmed</Alert.Title><Alert.Description>{attempt?.method ? `Paid with ${attempt.method}. ` : ""}Your booking {reference} is confirmed.</Alert.Description></Alert.Content></Alert> : null}
      {state === "failed" ? <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>Payment failed</Alert.Title><Alert.Description>The payment was not completed and you have not been charged. You can try again.</Alert.Description></Alert.Content></Alert> : null}
      {expired ? <Alert status="warning"><Alert.Indicator /><Alert.Content><Alert.Title>Booking expired</Alert.Title><Alert.Description>The hold on this vehicle ran out before payment. Start a new booking.</Alert.Description></Alert.Content></Alert> : null}
      {start.isError ? <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>Payment could not be started</Alert.Title><Alert.Description>{start.error instanceof ApiError ? start.error.message : "Try again in a moment."}</Alert.Description></Alert.Content></Alert> : null}

      {state !== "paid" && !expired && (state === "idle" || state === "failed") ? (
        <Button variant="primary" className="min-h-12 w-full" isPending={start.isPending} onPress={() => void pay().catch(() => undefined)}>
          {state === "failed" ? "Try payment again" : "Pay with ABA PayWay"}
        </Button>
      ) : null}
    </section>
  );
}
