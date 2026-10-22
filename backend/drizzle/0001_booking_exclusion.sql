CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_no_overlap"
  EXCLUDE USING gist (
    "vehicle_id" WITH =,
    tstzrange("pickup_at", "return_at", '[)') WITH &&
  )
  WHERE ("booking_status" IN ('confirmed', 'ready_for_pickup', 'active'));
