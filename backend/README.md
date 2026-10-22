# RideGo API

Backend for **vehicle rental** and **Expat Loan** (Cambodia). Bun, Elysia v2 (RC), PostgreSQL, Drizzle ORM, Better Auth.
The source of truth for scope is [RideGo_BACKEND_PLAN_ELYSIA.md](./RideGo_BACKEND_PLAN_ELYSIA.md).

## Run it

```bash
cp .env.example .env            # then edit
docker compose up -d            # PostgreSQL 17 on :5432 (or point DATABASE_URL at your own)
bun install
bun run db:migrate              # applies ./drizzle (includes the no-double-booking constraint)
bun run db:seed                 # Cambodia locations, six vehicles, helmet and jacket add-ons
SEED_ADMIN_EMAIL=you@example.com bun run db:seed   # optional: also creates a super_admin with that email
bun run dev                     # http://localhost:3001, docs at /api/v1/docs
```

| Script | What it does |
| --- | --- |
| `bun test` | 140 tests on an in-memory PGlite database (no Postgres needed) |
| `bun run typecheck` / `bun run lint` | TypeScript 6 and ESLint |
| `bun run db:generate` | New migration from schema changes (`drizzle-kit`) |
| `bun run build` / `bun run start` | Bundle / run |

Production refuses to start without `BETTER_AUTH_SECRET`, Google OAuth credentials and `TELEGRAM_BOT_TOKEN`.

## Sign-in

- **Google**: Better Auth social provider. Start with `POST /api/v1/auth/sign-in/social`.
- **Telegram**: the Login Widget payload is posted to `POST /api/v1/auth/telegram/login`. The HMAC signature and freshness are verified on the server before a session is created. Telegram users have no email, so a reserved `@users.ridego.invalid` placeholder fills the column; it is never shown as a real email.
- No OTP. Roles (`customer`, `admin`, `super_admin`) are assigned only in the database. The first admin is created with `SEED_ADMIN_EMAIL` and linked when that person signs in with Google using the same email.

## Layout

```
src/
  index.ts           starts the server (only place that listens)
  app.ts             composition root, exports the typed app
  env.ts             validated environment
  plugins/           request id, errors, CORS, OpenAPI, auth macros, security headers, access log
  routes/<feature>/  index.ts (HTTP), model.ts (schemas), service.ts (rules + queries)
  libs/              db + schema, money, dates, references, pagination, hashing, idempotency, Telegram verification
  providers/         storage (local disk) and payment (pending-only mock) interfaces
drizzle/             migrations
tests/
```

## Rules worth knowing

- **Money** is integer minor units with an explicit `currency` (USD or KHR). The server prices every booking; client totals are ignored.
- **No double booking**: the booking service locks the vehicle row and re-checks inside a transaction, and a `btree_gist` exclusion constraint on `bookings` makes overlapping holds (confirmed, ready_for_pickup, active) impossible even if a race slips through.
- **Loans** are never decided automatically. Customers can submit a draft and send back requested documents; every other status change is a staff action along an explicit transition map, recorded in `loan_status_history`.
- **Documents** are private: content-sniffed (PDF, JPG, PNG), 5 MB, stored under server-generated keys that no response ever includes.
- Every error is `{ success: false, error: { code, message, details }, requestId }` with a stable code.

## Not built yet

ABA payments (interface only), SMS/OTP (not wanted), automated KYC, credit scoring and lender APIs (explicitly out of scope), cloud file storage (interface only).
