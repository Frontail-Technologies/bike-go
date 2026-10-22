import { invalid } from "@/libs/api";

const asObject = (value: unknown): Record<string, unknown> => (value && typeof value === "object" ? (value as Record<string, unknown>) : {});

function fromText(text: string): Record<string, unknown> {
  try {
    return asObject(JSON.parse(text));
  } catch {
    return Object.fromEntries(new URLSearchParams(text));
  }
}

export function transactionIdFromCallback(text: string) {
  const body = fromText(text);
  if (typeof body.tran_id === "string" && body.tran_id) return body.tran_id;
  if (typeof body.response === "string") {
    try {
      const decoded = asObject(JSON.parse(Buffer.from(body.response, "base64").toString("utf8")));
      if (typeof decoded.tran_id === "string" && decoded.tran_id) return decoded.tran_id;
    } catch {
      throw invalid("response", "The callback response could not be decoded.");
    }
  }
  throw invalid("tran_id", "The callback has no transaction id.");
}
