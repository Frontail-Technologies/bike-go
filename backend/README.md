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

The server accepts bodies up to `MAX_REQUEST_BODY_BYTES` (64 MiB, enough for ten 5 MB vehicle images in one request) so that a file over its 5 MB limit gets a structured `413 FILE_TOO_LARGE`; only larger bodies are cut off.

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
- **Banners**: `GET /api/v1/banners?placement=` returns only banners showing now: `inactive` and `expired` are always hidden, and for `active` and `scheduled` the dates decide (before `start_at` it is scheduled, from `end_at` it is expired). Order is `display_order`, then creation time. Staff manage them at `/admin/banners` (list with placement, status, search and sort; status filters use the effective status). Delete removes the row because nothing references a banner; set `inactive` to only hide one.
- **Exchange rates** are recorded by staff (`/admin/fx-rates`, append-only, each with a source and an effective date). Native USD and KHR amounts are never converted. A rate is used only to derive loan limits for KHR, which has no native limits; with no rate on file, KHR loans are refused.
- **Booking holds**: a new booking is `pending` and `unpaid` with `hold_expires_at` (`BOOKING_HOLD_MINUTES`, default 15). An unexpired hold blocks the vehicle; once it lapses the booking becomes `expired` and no longer blocks. Cancellation does not calculate any refund yet.
- **No double booking**: the booking service locks the vehicle row and re-checks inside a transaction, and a `btree_gist` exclusion constraint on `bookings` makes overlapping holds (pending, confirmed, ready_for_pickup, active) impossible even if a race slips through.
- **Loans** are never decided automatically. Customers can submit a draft and send back requested documents; every other status change is a staff action along an explicit transition map, recorded in `loan_status_history`.
- **Documents** are private: content-sniffed (PDF, JPG, PNG), 5 MB, stored under server-generated keys that no response ever includes. Files go to Cloudflare R2 (`STORAGE_DRIVER=r2`) or, for local development only, to disk (`STORAGE_DRIVER=local`, the default).

## Speed

- **Sessions** use Better Auth's signed cookie cache for 60 seconds, so a signed-in customer request does not read the session and user from the database each time. Staff routes (`/admin/*`) always check the database, so a demoted or signed-out admin is refused at once. A copy of a customer cookie from before sign-out can work for up to 60 seconds.
- **Holds** are not expired by reads. A pending booking whose hold has lapsed is shown as `expired` (and counted and filtered as `expired`) without writing; the row is changed by the sweeper and by the write paths (create a booking, pay, cancel, staff status change).
- **Public caching**: `locations`, `banners`, `addons`, `fx-rates/current`, `vehicles` and `vehicles/:slug` send `Cache-Control: public` with a short `max-age` plus an `ETag`, and answer `If-None-Match` with an empty `304`. Date-filtered vehicle searches, availability, errors and signed-in routes are never cached.
- **Dashboard** results are kept for `DASHBOARD_CACHE_SECONDS` (default 15, `0` turns it off). `DATABASE_POOL_MAX` overrides the pool size (default 10, 20 in production).
- Admin booking search uses subqueries instead of joining every booking to users and vehicles, and `bookings.created_at` is indexed for the default newest-first list.

## File uploads

Files are sent to the resource that owns them, as `multipart/form-data` in the same request as the other fields. The backend validates the real file content, stores the file through the storage provider and keeps the storage key internal: no response, and no OpenAPI field, carries a key, bucket or path. Clients get image addresses on this API instead.

| Resource | Request | Rules |
| --- | --- | --- |
| Banner | `POST /admin/banners`, `PATCH /admin/banners/:id` with `image` | one JPEG, PNG or WebP, 5 MB. Public image at `/banners/:id/image` while the banner is showing, staff image at `/admin/banners/:id/image` |
| Vehicle | `POST /admin/vehicles` with `images` (repeat the field) and `primaryImageIndex`; `PATCH /admin/vehicles/:id` with `images`, `removeImageIds`, `imageOrder`, `primaryImageId` or `primaryImageIndex` | up to 10 JPEG, PNG or WebP images, 5 MB each. The first image is primary. Ids are image ids; lists are a JSON array or comma-separated. Images are served at `/vehicles/images/:imageId` |
| Loan document | `POST /loans/:reference/documents` with `file` and `type`; `PATCH /loans/:reference/documents/:documentId` with `file` and/or `type` | PDF, JPEG or PNG, 5 MB. Replacing a document returns it to `uploaded` for review; verified documents cannot be replaced |

Files and PostgreSQL cannot share a transaction, so mutations compensate: new files are uploaded first, then the database changes; if that fails the new files are deleted, and old files are deleted only after the change is saved. A cleanup that fails is logged (without the key) and never fails the request. There is no generic upload endpoint: nothing else needed one. Failures are `422 FILE_TYPE_INVALID` (or `DOCUMENT_TYPE_INVALID` for documents) and `413 FILE_TOO_LARGE`.

## Cloudflare R2

1. Create a **private** bucket (no public access, no custom public domain) and an API token with Object Read and Write on that bucket.
2. Set `STORAGE_DRIVER=r2`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and either `R2_ACCOUNT_ID` (the endpoint becomes `https://<account>.r2.cloudflarestorage.com`) or `R2_ENDPOINT`.
3. The API uploads and streams files itself, after checking ownership and the real file type, so browsers never get bucket access. Direct browser uploads (`createUploadTarget`) are deliberately not offered because a presigned upload cannot enforce the 5 MB or file-type limits. `getDownloadUrl` can produce short-lived presigned links if a use for them appears.
4. Tests run the real R2 provider against an in-process S3-compatible fake, so no Cloudflare account is needed to run them.
## ABA PayWay (KHQR)

Payment goes through PayWay's hosted checkout, limited to `abapay_khqr`.

1. `POST /api/v1/bookings/:reference/payments` (customer) creates a payment attempt for the booking's stored total and returns a signed form: `{ checkout: { action, method: "POST", fields } }`. The frontend submits it as a browser form POST to open the PayWay page. A repeat call while an attempt is open returns the same transaction.
2. PayWay notifies `POST /api/v1/payments/payway/callback` and sends the customer back to `<first FRONTEND_ORIGINS>/bookings/:reference/confirmation`. The callback body is never trusted: only the transaction id is read, then the server asks PayWay (`check-transaction-2`, signed) and checks the approved amount and currency against the stored attempt before confirming the booking.
3. `GET /api/v1/bookings/:reference/payment` returns the state and settles an open attempt the same way, so the confirmation page can poll it if a callback is missed.

Settling is idempotent and locks the vehicle, payment and booking rows. A payment that cannot confirm its booking is kept as `paid` with `payments.review` set so staff can refund it: `paid_after_hold_expired` (someone else took the vehicle), `booking_cancelled`. An approved transaction for the wrong amount or currency is `failed` with `amount_mismatch`. Refunds are not built.

Set `PAYMENT_DRIVER=payway`, `PAYWAY_MERCHANT_ID` and `PAYWAY_API_KEY`. The sandbox URLs are the defaults; production refuses to start with sandbox URLs, so set `PAYWAY_CHECKOUT_URL` and `PAYWAY_CHECK_URL` to the live ones. `BETTER_AUTH_URL` must be the public address of this API, because PayWay calls `<BETTER_AUTH_URL>/api/v1/payments/payway/callback`. With `PAYMENT_DRIVER=disabled` (the default) the payment endpoints answer `503 PAYMENT_UNAVAILABLE`. Tests run the real provider against an in-process fake PayWay that verifies request signatures.

- Every error is `{ success: false, error: { code, message, details }, requestId }` with a stable code.

## Not built yet

Refunds, SMS/OTP (not wanted), automated KYC, credit scoring and lender APIs (explicitly out of scope).
