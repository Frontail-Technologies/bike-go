# RideGo Backend Plan

> Backend-only execution plan for Codex.
> Market: Cambodia.
> Frontend/design-system work is out of scope.
> Existing customer authentication: Google + Telegram.
> Do NOT add OTP login.
> ABA payment integration is deferred until explicitly requested.

---

# 0. Non-Negotiable Architecture Rules

This backend must follow current **Elysia v2** conventions, not a generic Express/Nest-style architecture.

Before implementation:

```bash
bunx skills add elysiajs/skills
```

Then read the installed official Elysia skill and current Elysia v2 docs.

Use:

- Elysia v2 RC
- Bun
- TypeScript strict mode
- PostgreSQL
- Drizzle ORM
- Better Auth where compatible with the existing Google/Telegram auth flow
- `@elysia/openapi`
- Bun test runner

Do not mix Elysia v1.4 APIs into the v2 codebase.

Important Elysia v2 rules:

- `src/index.ts` only starts the server.
- `src/app.ts` is the composition root and exports the typed Elysia app.
- Each feature is an Elysia plugin/controller.
- Prefer feature-based folders.
- Feature HTTP schemas live in `model.ts`.
- Business logic lives in `service.ts` and should not depend on Elysia `Context`.
- Shared Elysia lifecycle/auth behavior belongs in `plugins/`.
- Shared non-Elysia code belongs in `libs/`.
- Use named Elysia plugins so plugin deduplication works correctly.
- Use Elysia `derive`/macros for request-derived auth context.
- Do not create controller classes wrapping Elysia.
- Do not pass the full Elysia `Context` into services.
- Do not create repository layers by default. Add one only when a feature has genuinely complex/reusable persistence logic.
- Prefer Elysia-native runtime schemas and type inference.
- Prefer named reusable `.model()` schemas where they improve route consistency/OpenAPI.
- Use `t` from Elysia unless the installed skill recommends another Standard Schema for a specific case.
- Use `status(...)` / Elysia-native response behavior according to the installed v2 skill.
- Use plugin scope syntax from v2; do not use removed v1 `resolve` or old scoped syntax.

---

# 1. Recommended Elysia Folder Structure

Use the structure recommended by the Elysia v2 best-practice guide:

```text
src/
  index.ts
  app.ts
  env.ts

  libs/
    db/
      index.ts
      schema/
        auth.ts
        user.ts
        location.ts
        vehicle.ts
        booking.ts
        loan.ts
        document.ts
        idempotency.ts
      relations.ts
      seed.ts

    money.ts
    reference.ts
    date.ts
    pagination.ts
    hash.ts

  plugins/
    openapi.ts
    cors.ts
    request-meta.ts
    auth.ts
    error.ts

  routes/
    health/
      index.ts
      model.ts

    auth/
      index.ts
      service.ts
      model.ts

    user/
      index.ts
      service.ts
      model.ts

    location/
      index.ts
      service.ts
      model.ts

    vehicle/
      index.ts
      service.ts
      model.ts

    availability/
      index.ts
      service.ts
      model.ts

    booking/
      index.ts
      service.ts
      model.ts

    loan/
      index.ts
      service.ts
      model.ts

    document/
      index.ts
      service.ts
      model.ts

    admin/
      index.ts

      dashboard/
        index.ts
        service.ts
        model.ts

      vehicle/
        index.ts
        service.ts
        model.ts

      booking/
        index.ts
        service.ts
        model.ts

      customer/
        index.ts
        service.ts
        model.ts

      loan/
        index.ts
        service.ts
        model.ts

  providers/
    storage/
      index.ts
      local.ts

    payment/
      index.ts
      mock.ts

tests/
  health.test.ts
  auth.test.ts
  vehicle.test.ts
  availability.test.ts
  booking.test.ts
  loan.test.ts
  admin.test.ts

drizzle/
```

Rules:

### `index.ts`
Process entry point only.

Example responsibility:

```ts
import { app } from './app'
import { env } from './env'

app.listen(env.PORT)
```

No routes or business logic here.

### `app.ts`
Composition root only.

It should:

- create root Elysia instance
- register global plugins
- register feature route plugins
- export `App = typeof app`
- NOT call `.listen()`

Conceptually:

```ts
export const app = new Elysia({ name: 'RideGo.App' })
  .use(requestMetaPlugin)
  .use(errorPlugin)
  .use(corsPlugin)
  .use(openapiPlugin)
  .use(healthRoutes)
  .use(authRoutes)
  .use(userRoutes)
  .use(locationRoutes)
  .use(vehicleRoutes)
  .use(availabilityRoutes)
  .use(bookingRoutes)
  .use(loanRoutes)
  .use(documentRoutes)
  .use(adminRoutes)

export type App = typeof app
```

### `routes/<feature>/index.ts`
The Elysia instance is the controller.

Responsibilities:

- route path
- HTTP concerns
- schema/model references
- auth macro flags
- calling feature service
- response mapping

No detailed SQL/business rules.

### `routes/<feature>/service.ts`
Pure application/domain logic.

Responsibilities:

- business rules
- transactions
- Drizzle queries owned by the feature
- calculations
- state transitions

Do NOT depend on:

- cookies
- Elysia Context
- response objects
- HTTP headers unless passed as an explicit plain value

### `routes/<feature>/model.ts`
HTTP/domain schemas and inferred types.

Use:

- Elysia `t`
- named schemas/models when helpful
- request body schema
- params schema
- query schema
- response schema

Avoid manually duplicating interfaces that can be inferred from schemas.

### `plugins/`
Only shared Elysia-specific behavior:

- auth/session derivation
- role macros
- request IDs
- error mapping
- CORS
- OpenAPI setup

### `libs/`
Pure/shared code unrelated to Elysia request lifecycle:

- DB client/schema
- money helpers
- ID/reference generation
- hashing
- date calculations
- pagination helpers

---

# 2. Elysia Auth Pattern

Authentication is shared HTTP/request behavior, so implement it as a named Elysia plugin.

Preferred shape:

```text
plugins/auth.ts
```

Responsibilities:

- resolve/derive current session using Elysia v2 `derive`
- expose typed `user` / `session`
- define macros such as:
  - `auth: true`
  - `admin: true`
  - `superAdmin: true`
- return/throw consistent auth errors
- never trust roles from request body/query

Use the exact macro/derive syntax supported by the installed Elysia v2 version.

Do NOT:

- create `AuthMiddleware` classes
- manually pass Elysia Context to every service
- repeat auth lookup inside every route

Named plugin example intent:

```ts
new Elysia({ name: 'RideGo.Auth' })
```

---

# 3. Existing Authentication

Frontend already supports:

- Google login
- Telegram login

There is no OTP login.

Before changing auth:

1. Inspect current frontend auth code.
2. Determine current Google flow/callback contract.
3. Determine current Telegram flow:
   - Login Widget
   - Mini App init data
   - bot flow
   - or other
4. Preserve the existing frontend UX.
5. Implement server-side verification accordingly.

Google requirements:

- provider identity
- user/account persistence
- secure callback
- session creation
- returning users
- account linking only when safe

Telegram requirements:

- verify Telegram-provided auth data server-side
- never trust raw browser-provided Telegram identity
- persist verified Telegram provider ID
- Telegram account must work without email if applicable

Roles:

```text
customer
admin
super_admin
```

---

# 4. Domain Naming — Use `Vehicle`, Not `Motorcycle`

The backend must be generic.

Use:

```text
vehicle
vehicles
vehicle_id
vehicle_images
vehicle_blocks
vehicle_type
```

Do NOT name backend domain tables/modules:

```text
motorcycle
motorcycles
motorcycle_id
```

This keeps the backend reusable for:

- motorcycles
- scooters
- cars
- other rental vehicles later

Initial supported `vehicle_type` values:

```text
motorcycle
scooter
car
other
```

Initial RideGo inventory can still mostly be motorcycles/scooters.

`category` remains separate, for example:

```text
cruiser
sport
adventure
touring
commuter
premium
```

Vehicle-specific optional attributes should not force every future vehicle into motorcycle-only fields.

For MVP, fields such as `engine_cc` may be nullable.

---

# 5. Database Model

Use Drizzle schema under:

```text
src/libs/db/schema/
```

Keep schema split by domain.

---

## 5.1 Auth tables

Use Better Auth/current auth library required tables.

Support provider accounts for:

```text
google
telegram
```

Do not duplicate session/provider state in `customer_profiles`.

---

## 5.2 customer_profiles

Fields:

- id UUID
- user_id unique FK
- full_name nullable
- email nullable
- phone nullable
- telegram_username nullable
- avatar_url nullable
- date_of_birth nullable
- nationality nullable
- address nullable
- city nullable
- created_at
- updated_at

Only keep fields not cleanly owned by auth tables.

---

## 5.3 locations

Fields:

- id UUID
- name
- address
- city
- latitude nullable
- longitude nullable
- active boolean
- created_at
- updated_at

---

## 5.4 vehicles

Fields:

- id UUID
- slug unique
- vehicle_type
- name
- brand
- model
- category
- description nullable
- engine_cc nullable
- transmission nullable
- fuel_type nullable
- seats nullable
- daily_rental_price_minor
- security_deposit_minor
- currency
- registration_number unique
- location_id FK
- status
- specifications JSONB
- created_at
- updated_at

Vehicle statuses:

```text
available
rented
maintenance
inactive
```

Do not use the `status` column alone to determine date availability.

---

## 5.5 vehicle_images

- id UUID
- vehicle_id FK
- storage_key
- public_url nullable
- alt_text nullable
- sort_order
- created_at

---

## 5.6 vehicle_blocks

Manual/maintenance unavailability:

- id UUID
- vehicle_id FK
- start_at
- end_at
- reason
- created_at

---

## 5.7 booking_addons

- id UUID
- code unique
- name
- description nullable
- price_per_day_minor
- currency
- active
- created_at
- updated_at

Examples:

```text
Helmet
Riding Jacket
```

---

## 5.8 bookings

- id UUID
- reference unique
- user_id FK
- vehicle_id FK
- pickup_location_id FK
- return_location_id FK
- pickup_at
- return_at
- rental_days
- currency
- daily_rate_snapshot_minor
- rental_subtotal_minor
- addons_total_minor
- platform_fee_minor
- security_deposit_snapshot_minor
- taxes_minor
- total_payable_minor
- booking_status
- payment_status
- cancelled_at nullable
- cancellation_reason nullable
- created_at
- updated_at

Booking statuses:

```text
pending
confirmed
ready_for_pickup
active
completed
cancelled
```

Payment statuses:

```text
unpaid
pending
paid
failed
refunded
partially_refunded
```

---

## 5.9 booking_addon_items

- id UUID
- booking_id FK
- addon_id FK
- name_snapshot
- unit_price_snapshot_minor
- currency
- quantity
- days
- total_minor

---

# 6. Expat Loan Tables

## loan_applications

- id UUID
- reference unique
- user_id FK
- status
- loan_type
- currency
- requested_amount_minor
- tenure_months
- purpose nullable

Personal snapshot:

- full_name
- mobile
- email
- date_of_birth
- nationality
- current_city
- residence_status

Employment:

- employment_type
- employer_name
- job_title nullable
- monthly_income_minor
- work_experience_months
- has_active_bank_account

Other:

- submitted_at nullable
- created_at
- updated_at

Statuses:

```text
draft
submitted
documents_under_review
additional_documents_required
eligibility_review
approved
rejected
```

---

## loan_documents

- id UUID
- application_id FK
- type
- storage_key
- original_filename
- mime_type
- size_bytes
- verification_status
- review_note nullable
- uploaded_at
- reviewed_at nullable
- reviewed_by nullable

Types:

```text
passport
visa_or_residence_permit
employment_proof
salary_or_income_proof
address_proof
bank_statement
other
```

Statuses:

```text
uploaded
verified
needs_review
rejected
```

---

## loan_status_history

- id UUID
- application_id FK
- old_status nullable
- new_status
- changed_by nullable
- note nullable
- created_at

Every status transition must create a history record.

---

## idempotency_keys

- id UUID
- key
- scope
- user_id nullable
- request_hash
- response_code nullable
- response_body JSONB nullable
- expires_at
- created_at

Unique:

```text
scope + key
```

---

# 7. Money & Currency Rules

Project market is Cambodia.

Expected currencies may include:

```text
USD
KHR
```

Do not hardcode INR.

Rules:

- every money-bearing business record has explicit currency
- use integer minor units
- never use JS floating-point calculations for financial totals
- backend calculates booking totals
- snapshot prices into bookings
- do not guess final USD/KHR commercial policy
- keep configuration ready for business decision later

Create pure helpers in:

```text
src/libs/money.ts
```

---

# PHASE 0 — Bootstrap

Tasks:

- initialize Bun backend
- install Elysia v2 RC
- install official Elysia skill
- read skill before coding
- install Drizzle/Postgres driver
- install Better Auth/current compatible auth dependency
- install `@elysia/openapi`
- create `src/index.ts`
- create `src/app.ts`
- create `src/env.ts`
- create shared plugins
- create health route plugin
- add `.env.example`

Global Elysia plugins:

```text
request-meta
error
cors
openapi
auth
```

Keep them named.

Health:

```text
GET /api/v1/health
```

Verification:

- TypeScript
- tests
- server start
- health endpoint
- OpenAPI loads

Commit:

```text
chore(backend): initialize Elysia v2 backend
```

---

# PHASE 1 — Database & Seed

Tasks:

- create Drizzle schema
- relations
- migrations
- indexes
- foreign keys
- seed system

Important indexes:

- vehicles.slug
- vehicles.location_id + status
- bookings.user_id + created_at
- bookings.vehicle_id + pickup_at + return_at
- bookings.reference
- bookings.booking_status
- loan_applications.user_id + created_at
- loan_applications.reference
- loan_applications.status
- loan_documents.application_id
- loan_status_history.application_id + created_at

Seed:

- Cambodia location(s)
- Royal Enfield Classic 350
- Royal Enfield Himalayan
- Royal Enfield Hunter 350
- Yamaha MT-15
- KTM Duke 200
- Honda Activa

Use appropriate `vehicle_type` values.

Commit:

```text
feat(db): add RideGo domain schema and seed
```

---

# PHASE 2 — Google + Telegram Auth

Implement using the shared Elysia auth plugin.

Routes:

```text
GET   /api/v1/me
PATCH /api/v1/me
```

Requirements:

- Google provider flow
- Telegram provider verification
- secure session
- typed `user` context from auth macro/plugin
- owner authorization
- admin role macros

Tests:

- valid auth
- invalid auth
- Telegram forgery rejection
- customer admin denial
- admin success
- role input ignored

Commit:

```text
feat(auth): integrate Google and Telegram authentication
```

---

# PHASE 3 — Vehicle Catalog

Public:

```text
GET /api/v1/locations
GET /api/v1/vehicles
GET /api/v1/vehicles/:slug
```

Filters:

- location
- vehicle type
- category
- brand
- min/max price
- engine range
- transmission
- pickup date
- return date
- sort
- pagination

Admin:

```text
GET    /api/v1/admin/vehicles
POST   /api/v1/admin/vehicles
GET    /api/v1/admin/vehicles/:id
PATCH  /api/v1/admin/vehicles/:id
DELETE /api/v1/admin/vehicles/:id

GET    /api/v1/admin/locations
POST   /api/v1/admin/locations
PATCH  /api/v1/admin/locations/:id
```

Prefer deactivation over destructive delete when referenced.

Commit:

```text
feat(vehicle): add vehicle catalog and admin CRUD
```

---

# PHASE 4 — Availability

Public:

```text
GET /api/v1/vehicles/:id/availability
```

A vehicle is unavailable when the requested interval overlaps:

- confirmed booking
- ready_for_pickup booking
- active booking
- vehicle block

Cancelled bookings do not block.

Critical:

Availability and booking creation must be concurrency-safe at DB/service level.

Do not rely on frontend availability.

Mandatory tests:

- free interval
- overlap rejection
- cancelled allowed
- maintenance block rejection
- concurrent booking requests -> only one succeeds

Commit:

```text
feat(availability): add transaction-safe vehicle availability
```

---

# PHASE 5 — Booking

Customer:

```text
GET  /api/v1/bookings
GET  /api/v1/bookings/:reference
POST /api/v1/bookings
POST /api/v1/bookings/:reference/cancel
```

Frontend submits:

- vehicle
- locations
- dates
- add-ons

Backend owns:

- rental days
- rate
- subtotal
- add-ons
- fees
- taxes
- deposit
- total

Use idempotency for booking creation.

Never trust frontend price totals.

Tests:

- pricing
- ownership
- conflicts
- cancellation
- idempotency
- currency handling

Commit:

```text
feat(booking): implement rental booking domain
```

---

# PHASE 6 — Expat Loan

Customer:

```text
POST  /api/v1/loans
GET   /api/v1/loans
GET   /api/v1/loans/:reference
PATCH /api/v1/loans/:reference
POST  /api/v1/loans/:reference/submit
```

Rules:

- owner can edit draft
- submitted data cannot silently mutate
- explicit status transition map
- admin-only decision transitions
- every transition recorded

Do not implement:

- credit scoring
- automated approval
- lender API
- automated KYC

Tests:

- draft update
- submit
- ownership
- immutable submitted data
- invalid transition
- admin-only approval/rejection
- status history

Commit:

```text
feat(loan): implement expat loan lifecycle
```

---

# PHASE 7 — Loan Documents

Storage provider abstraction:

```ts
interface StorageProvider {
  createUploadTarget(...)
  getDownloadUrl(...)
  delete(...)
}
```

Current implementation:

```text
local/mock development provider
```

Routes:

```text
POST /api/v1/loans/:reference/documents
GET  /api/v1/loans/:reference/documents
```

Admin:

```text
PATCH /api/v1/admin/loans/:reference/documents/:documentId/review
```

Rules:

- private by default
- owner access only
- admin review
- MIME validation
- size validation
- sanitized names
- internal storage key not unnecessarily exposed

Commit:

```text
feat(document): add loan document workflow
```

---

# PHASE 8 — Admin APIs

Dashboard:

```text
GET /api/v1/admin/dashboard
```

Bookings:

```text
GET   /api/v1/admin/bookings
GET   /api/v1/admin/bookings/:reference
PATCH /api/v1/admin/bookings/:reference/status
```

Customers:

```text
GET /api/v1/admin/customers
GET /api/v1/admin/customers/:id
```

Loans:

```text
GET   /api/v1/admin/loans
GET   /api/v1/admin/loans/:reference
PATCH /api/v1/admin/loans/:reference/status
```

Vehicles are handled by admin vehicle routes from Phase 3.

Support:

- pagination
- search
- filters
- date range
- sort

Commit:

```text
feat(admin): complete admin APIs
```

---

# PHASE 9 — OpenAPI & Hardening

Use `@elysia/openapi`.

Ensure route `model.ts` schemas produce useful OpenAPI.

Document:

- auth
- request/response types
- errors
- pagination
- idempotency
- status enums
- currencies

Hardening:

- CORS
- secure sessions
- provider callback security
- Telegram verification
- request body limits
- file limits
- secret redaction
- request IDs
- DB transaction review
- graceful shutdown
- production env validation

Commit:

```text
chore(backend): document and harden API
```

---

# PHASE 10 — ABA Payment

## DEFERRED

Cambodia project will use ABA later.

Do not implement now.

Before implementation confirm:

- exact ABA merchant API/product
- merchant credentials
- supported currencies
- ABA KHQR/payment method requirements
- callback/webhook contract
- verification/signature rules
- expiry
- refund flow
- sandbox/test environment

Keep future provider interface:

```ts
interface PaymentProvider {
  createPayment(...)
  verifyPayment(...)
  getPaymentStatus(...)
  refund(...)
}
```

Booking domain must remain provider-independent.

Until then:

- no ABA SDK
- no credentials
- no fake callbacks
- payment can stay manual/mock

---

# 8. API Conventions

Prefix:

```text
/api/v1
```

Success:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "BOOKING_CONFLICT",
    "message": "This vehicle is not available for the selected period.",
    "details": null
  },
  "requestId": "..."
}
```

Stable codes:

```text
AUTH_REQUIRED
FORBIDDEN
VALIDATION_ERROR
NOT_FOUND
VEHICLE_UNAVAILABLE
BOOKING_CONFLICT
INVALID_BOOKING_STATUS
INVALID_LOAN_STATUS_TRANSITION
IDEMPOTENCY_CONFLICT
DOCUMENT_TYPE_INVALID
FILE_TOO_LARGE
INTERNAL_ERROR
```

---

# 9. Testing Rules

Prefer importing `app` directly in tests instead of starting a network server.

`app.ts` must therefore remain separate from `.listen()`.

Test at minimum:

- health
- auth guards
- vehicle filtering
- availability
- concurrent booking
- pricing
- ownership authorization
- idempotency
- loan transitions
- loan document ownership
- admin authorization

Business services should be independently testable because they are not coupled to Elysia Context.

---

# 10. Non-Goals

Do not add:

- frontend
- OTP
- SMS
- Redis
- microservices
- Kafka
- WebSockets
- GraphQL
- GPS tracking
- automated KYC
- credit scoring
- automatic lender decisions
- ABA before Phase 10
- unnecessary repository/controller abstractions

---

# 11. Codex Execution Contract

For each phase:

1. Inspect current repository.
2. Read installed Elysia skill/current v2 docs when framework behavior matters.
3. Implement current phase using Elysia feature plugins.
4. Run TypeScript.
5. Run tests.
6. Run any migration/schema verification.
7. Fix all failures.
8. Commit working state.
9. Continue to next phase unless genuinely blocked.

At phase end report:

## Completed
## Verification
## Main files changed
## Decisions
## Remaining issues
## Commit

Treat this file as the backend source of truth.
