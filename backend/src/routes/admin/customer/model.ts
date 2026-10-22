import { t, type UnwrapModels } from "elysia";
import { Envelope, PaginationQuery } from "@/libs/api";

const Customer = t.Object({
  id: t.String({ format: "uuid" }),
  role: t.UnionEnum(["customer", "admin", "super_admin"]),
  name: t.String(),
  email: t.Nullable(t.String()),
  phone: t.Nullable(t.String()),
  city: t.Nullable(t.String()),
  providers: t.Array(t.String()),
  bookingCount: t.Number(),
  loanCount: t.Number(),
  createdAt: t.String({ format: "date-time" }),
});

export const CustomersGet = {
  Query: t.Object({
    ...PaginationQuery.properties,
    q: t.Optional(t.String({ minLength: 1, description: "Name, email or phone" })),
    sort: t.Optional(t.UnionEnum(["newest", "oldest", "name"])),
  }),
  Response: Envelope(t.Array(Customer)),
};

export const CustomerGet = {
  Params: t.Object({ id: t.String({ format: "uuid" }) }),
  Response: Envelope(
    t.Object({
      ...Customer.properties,
      profile: t.Object({
        fullName: t.Nullable(t.String()),
        dateOfBirth: t.Nullable(t.String()),
        nationality: t.Nullable(t.String()),
        address: t.Nullable(t.String()),
        telegramUsername: t.Nullable(t.String()),
      }),
      recentBookings: t.Array(t.Object({ reference: t.String(), bookingStatus: t.String(), vehicleName: t.String(), pickupAt: t.String({ format: "date-time" }), totalPayableMinor: t.Number(), currency: t.String() })),
      recentLoans: t.Array(t.Object({ reference: t.String(), status: t.String(), loanType: t.String(), requestedAmountMinor: t.Number(), currency: t.String(), createdAt: t.String({ format: "date-time" }) })),
    }),
  ),
};

export type CustomersGet = UnwrapModels<typeof CustomersGet>;
