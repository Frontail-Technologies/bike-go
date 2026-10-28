"use client";

import { Alert, Spinner } from "@heroui/react";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { StartedPayment } from "../types";
import { useBookingPayment } from "../hooks/use-checkout";
import { useStartPaymentMutation } from "../hooks/use-payments";

declare global {
  interface Window {
    AbaPayway?: { checkout: () => void };
  }
}

/** PayWay's checkout plugin. It builds the payment window around the form below; the form action decides sandbox or production. */
const PLUGIN_URL = process.env.NEXT_PUBLIC_PAYWAY_SCRIPT_URL ?? "https://checkout.payway.com.kh/plugins/checkout2-0.js";

const money = (minor: number, currency: string) => new Intl.NumberFormat("en-US", { style: "currency", currency }).format(minor / 100);

/**
 * Pays a pending booking through ABA PayWay's hosted checkout (ABA Pay, KHQR and the other methods the merchant account enables).
 * The signed form comes from the backend; the browser never holds the signing key and success is only ever read back from the server.
 */
export function PaywayCheckout({ reference, onPaid }: { reference: string; onPaid?: () => void }) {
  const start = useStartPaymentMutation();
  const formRef = useRef<HTMLFormElement>(null);
  const [payment, setPayment] = useState<StartedPayment | null>(null);
  const opened = useRef(false);
  // Fetched from the start (not just once a payment attempt is open) so we learn
  // paymentsEnabled from the server before deciding whether to offer checkout at all —
  // a client-side flag here could drift from the backend's actual payment driver.
  const status = useBookingPayment(reference, true);
  const paymentsEnabled = status.data?.paymentsEnabled ?? false;
  const attempt = status.data?.attempt;
  const state = attempt?.status ?? (payment ? "pending" : "idle");
  const expired = status.data?.bookingStatus === "expired";

  // Open PayWay's window once the signed form is in the page. The plugin may still be loading, so wait for it briefly.
  useEffect(() => {
    if (!payment || opened.current) return;
    const open = () => {
      if (!window.AbaPayway) return false;
      window.AbaPayway.checkout();
      opened.current = true;
      return true;
    };
    if (open()) return;
    const timer = window.setInterval(() => { if (open()) window.clearInterval(timer); }, 250);
    const giveUp = window.setTimeout(() => window.clearInterval(timer), 15_000);
    return () => { window.clearInterval(timer); window.clearTimeout(giveUp); };
  }, [payment]);

  useEffect(() => {
    if (state === "paid") onPaid?.();
  }, [state, onPaid]);

  async function pay() {
    if (!paymentsEnabled) return;
    opened.current = false;
    setPayment(await start.mutateAsync({ reference }));
  }

  // Avoid flashing the "not available" warning while the first fetch is still settling.
  if (status.isPending) return null;

  return (
    <section aria-label="Payment" className="flex flex-col gap-3">
      {!paymentsEnabled ? <Alert status="warning"><Alert.Indicator /><Alert.Content><Alert.Title>Online payments are not available yet</Alert.Title><Alert.Description>Your booking can be created, but checkout remains disabled until RideGo enables payments.</Alert.Description></Alert.Content></Alert> : null}
      {/* The plugin looks for this modal shell when it loads, so it is always present; the signed form is filled in when a payment starts. */}
      {paymentsEnabled ? <Script id="aba-payway-checkout" src={PLUGIN_URL} strategy="afterInteractive" /> : null}
      <div id="aba_main_modal" className="aba-modal">
        <div className="aba-modal-content">
          {payment ? (
            <form ref={formRef} method="POST" target="aba_webservice" action={payment.checkout.action} id="aba_merchant_request">
              {Object.entries(payment.checkout.fields).map(([name, value]) => <input key={name} type="hidden" name={name} value={String(value)} />)}
            </form>
          ) : null}
        </div>
      </div>
      {payment ? (
        <>
          <dl className="flex items-baseline justify-between gap-3 text-sm">
            <dt className="text-subtle">Booking {reference}</dt>
            <dd className="text-lg font-extrabold">{money(payment.amountMinor, payment.currency)}</dd>
          </dl>
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
      {start.isError ? <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>Payment could not be started</Alert.Title><Alert.Description>Try again in a moment.</Alert.Description></Alert.Content></Alert> : null}

      {paymentsEnabled && state !== "paid" && !expired && (state === "idle" || state === "failed") ? (
        <Button variant="primary" className="min-h-12 w-full" isPending={start.isPending} onPress={() => void pay().catch(() => undefined)}>
          {start.isPending ? <Spinner color="current" size="sm" /> : null}
          {state === "failed" ? "Try payment again" : "Pay with ABA PayWay"}
        </Button>
      ) : null}
    </section>
  );
}
