import { t } from "elysia";
import { Envelope } from "@/libs/api";

export const HealthGet = {
  Response: Envelope(
    t.Object({
      status: t.Literal("ok"),
      service: t.String(),
      time: t.String({ format: "date-time" }),
      uptimeSeconds: t.Number(),
    }),
  ),
};
