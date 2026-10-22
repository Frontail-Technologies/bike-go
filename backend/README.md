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
| `bun test` | 165 tests on an in-memory PGlite database (no Postgres needed) |
| `TEST_DATABASE_URL=postgres://.../ridego_test bun test` | The same suite on a real PostgreSQL. The database name must contain `test`: its schema is dropped and recreated |
| `bun run test:concurrency` | Only the booking concurrency and idempotency tests (set `TEST_DATABASE_URL` to run them on PostgreSQL, as CI does) |
| `bun run typecheck` / `bun run lint` | TypeScript 6 and ESLint |
| `bun run db:generate` | New migration from schema changes (`drizzle-kit`) |
| `bun run build` / `bun run start` | Bundle / run |

The server accepts bodies up to `MAX_REQUEST_BODY_BYTES` (16 MiB) so that a document over the 5 MB limit gets a structured `413 FILE_TOO_LARGE`; only larger bodies are cut off.

Production refuses to start without `BETTER_AUTH_SECRET`, Google OAuth credentials, `TELEGRAM_BOT_TOKEN` and `STORAGE_DRIVER=r2` with its R2 settings.

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
  routes/<feature>/  index.ts (HTTP), model.ts (schemas), types.ts (types), service.ts (rules + queries)
  libs/              db + schema + row locks, money, dates, references, pagination (paginate), hashing, idempotency, id-or-slug lookup, identity (placeholder emails), FX, Telegram verification, shared types.ts
  providers/         storage (local disk) and payment (pending-only mock) interfaces
drizzle/             migrations
tests/
```

## Rules worth knowing

- **Money** is integer minor units with an explicit `currency` (USD or KHR). The server prices every booking; client totals are ignored. VAT is `VAT_RATE_BPS` (default 1000, which is 10%) and platform fees are `PLATFORM_FEE_USD_MINOR` and `PLATFORM_FEE_KHR_MINOR` (default 0 until confirmed).
- **Exchange rates** are recorded by staff (`/admin/fx-rates`, append-only, each with a source and an effective date). Native USD and KHR amounts are never converted. A rate is used only to derive loan limits for KHR, which has no native limits; with no rate on file, KHR loans are refused.
- **Booking holds**: a new booking is `pending` and `unpaid` with `hold_expires_at` (`BOOKING_HOLD_MINUTES`, default 15). An unexpired hold blocks the vehicle; once it lapses the booking becomes `expired` and no longer blocks. Cancellation does not calculate any refund yet.
- **No double booking**: the booking service locks the vehicle row and re-checks inside a transaction, and a `btree_gist` exclusion constraint on `bookings` makes overlapping holds (pending, confirmed, ready_for_pickup, active) impossible even if a race slips through.
- **Loans** are never decided automatically. Customers can submit a draft and send back requested documents; every other status change is a staff action along an explicit transition map, recorded in `loan_status_history`.
- **Documents** are private: content-sniffed (PDF, JPG, PNG), 5 MB, stored under server-generated keys that no response ever includes. Files go to Cloudflare R2 (`STORAGE_DRIVER=r2`) or, for local development only, to disk (`STORAGE_DRIVER=local`, the default).

## Cloudflare R2

1. Create a **private** bucket (no public access, no custom public domain) and an API token with Object Read and Write on that bucket.
2. Set `STORAGE_DRIVER=r2`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and either `R2_ACCOUNT_ID` (the endpoint becomes `https://<account>.r2.cloudflarestorage.com`) or `R2_ENDPOINT`.
3. The API uploads and streams files itself, after checking ownership and the real file type, so browsers never get bucket access. Direct browser uploads (`createUploadTarget`) are deliberately not offered because a presigned upload cannot enforce the 5 MB or file-type limits. `getDownloadUrl` can produce short-lived presigned links if a use for them appears.
4. Tests run the real R2 provider against an in-process S3-compatible fake, so no Cloudflare account is needed to run them.
- Every error is `{ success: false, error: { code, message, details }, requestId }` with a stable code.

## Not built yet

ABA payments (interface only), SMS/OTP (not wanted), automated KYC, credit scoring and lender APIs (explicitly out of scope), cloud file storage (interface only).
