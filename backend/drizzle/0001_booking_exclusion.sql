-- A vehicle can never have two overlapping bookings that hold it (confirmed, ready_for_pickup, active).
-- This is the last line of defence: the booking service checks first and locks the vehicle row, but if two
-- requests ever race past those checks, Postgres refuses the second insert (SQLSTATE 23P01).
-- Periods are half-open [pickup, return), so one booking may start the moment another ends.
-- Cancelled, completed and pending bookings are outside the WHERE clause and never block.
CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_no_overlap"
  EXCLUDE USING gist (
    "vehicle_id" WITH =,
    tstzrange("pickup_at", "return_at", '[)') WITH &&
  )
  WHERE ("booking_status" IN ('confirmed', 'ready_for_pickup', 'active'));
