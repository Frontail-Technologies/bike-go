import { createHmac } from "node:crypto";

export type FakeTransaction = { status: "APPROVED" | "PENDING" | "DECLINED"; amount: string; currency: "USD" | "KHR" };

export type FakePayway = {
  url: string;
  merchantId: string;
  apiKey: string;
  transactions: Map<string, FakeTransaction>;
  checks: { tranId: string; signed: boolean }[];
  failNext: { value: boolean };
  stop: () => void;
};

const sign = (key: string, text: string) => createHmac("sha512", key).update(text).digest("base64");

export function startFakePayway(merchantId: string, apiKey: string): FakePayway {
  const transactions = new Map<string, FakeTransaction>();
  const checks: FakePayway["checks"] = [];
  const failNext = { value: false };

  const server = Bun.serve({
    port: 0,
    async fetch(request) {
      const body = (await request.json().catch(() => ({}))) as Record<string, string>;
      const signed = body.merchant_id === merchantId && body.hash === sign(apiKey, `${body.req_time}${body.merchant_id}${body.tran_id}`);
      checks.push({ tranId: body.tran_id ?? "", signed });
      if (failNext.value) {
        failNext.value = false;
        return new Response("down", { status: 503 });
      }
      if (!signed) return Response.json({ status: { code: "401", message: "Invalid hash" } });
      const found = transactions.get(body.tran_id ?? "");
      if (!found) return Response.json({ status: { code: "01", message: "Transaction not found" } });
      return Response.json({
        data: {
          payment_status_code: found.status === "APPROVED" ? 0 : 2,
          payment_status: found.status,
          original_amount: Number(found.amount),
          total_amount: Number(found.amount),
          original_currency: found.currency,
          payment_currency: found.currency,
        },
        status: { code: "00", message: "Success!" },
      });
    },
  });

  return { url: `http://localhost:${server.port}`, merchantId, apiKey, transactions, checks, failNext, stop: () => server.stop(true) };
}

type Holder = { __fakePayway?: FakePayway };

export const fakePayway = (): FakePayway => {
  const found = (globalThis as Holder).__fakePayway;
  if (!found) throw new Error("The fake PayWay is started by tests/setup.ts");
  return found;
};

export const registerFakePayway = (instance: FakePayway) => {
  (globalThis as Holder).__fakePayway = instance;
};
