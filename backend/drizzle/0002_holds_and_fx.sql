ALTER TYPE "public"."booking_status" ADD VALUE 'expired';--> statement-breakpoint
CREATE TABLE "fx_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base_currency" "currency" NOT NULL,
	"quote_currency" "currency" NOT NULL,
	"rate" numeric(20, 8) NOT NULL,
	"source" text NOT NULL,
	"effective_at" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fx_rates_pair_effective_unique" UNIQUE("base_currency","quote_currency","effective_at"),
	CONSTRAINT "fx_rates_distinct_currencies" CHECK ("fx_rates"."base_currency" <> "fx_rates"."quote_currency"),
	CONSTRAINT "fx_rates_rate_positive" CHECK ("fx_rates"."rate" > 0)
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "hold_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fx_rates" ADD CONSTRAINT "fx_rates_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fx_rates_lookup_idx" ON "fx_rates" USING btree ("base_currency","quote_currency","effective_at");--> statement-breakpoint
CREATE INDEX "bookings_hold_idx" ON "bookings" USING btree ("booking_status","hold_expires_at");--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_pending_has_hold" CHECK ("bookings"."booking_status" <> 'pending' OR "bookings"."hold_expires_at" IS NOT NULL);