import { t, type UnwrapModels } from "elysia";
import { Envelope } from "@/libs/api";

const Date_ = t.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$", description: "YYYY-MM-DD" });

export const Me = t.Object({
  id: t.String({ format: "uuid" }),
  role: t.UnionEnum(["customer", "admin", "super_admin"]),
  email: t.Nullable(t.String()),
  fullName: t.Nullable(t.String()),
  phone: t.Nullable(t.String()),
  telegramUsername: t.Nullable(t.String()),
  avatarUrl: t.Nullable(t.String()),
  dateOfBirth: t.Nullable(Date_),
  nationality: t.Nullable(t.String()),
  address: t.Nullable(t.String()),
  city: t.Nullable(t.String()),
  providers: t.Array(t.String(), { description: "Linked sign-in providers, for example google or telegram" }),
  profileComplete: t.Boolean(),
  missingFields: t.Array(t.String()),
});

export const MeGet = { Response: Envelope(Me) };

export const MePatch = {
  Body: t.Object({
    fullName: t.Optional(t.String({ minLength: 2, maxLength: 120 })),
    phone: t.Optional(t.String({ pattern: "^\\+?[\\d\\s-]{7,20}$", description: "International format, for example +855 12 345 678" })),
    dateOfBirth: t.Optional(Date_),
    nationality: t.Optional(t.String({ minLength: 2, maxLength: 80 })),
    address: t.Optional(t.String({ minLength: 3, maxLength: 300 })),
    city: t.Optional(t.String({ minLength: 2, maxLength: 80 })),
  }),
  Response: Envelope(Me),
};

export type MePatch = UnwrapModels<typeof MePatch>;
