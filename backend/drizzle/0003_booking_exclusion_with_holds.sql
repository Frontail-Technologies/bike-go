ALTER TABLE "bookings" DROP CONSTRAINT "bookings_no_overlap";--> statement-breakpoint
ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_no_overlap"
  EXCLUDE USING gist (
    "vehicle_id" WITH =,
    tstzrange("pickup_at", "return_at", '[)') WITH &&
  )
  WHERE ("booking_status" IN ('pending', 'confirmed', 'ready_for_pickup', 'active'));
