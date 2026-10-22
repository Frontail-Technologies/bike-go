CREATE TYPE "public"."payment_attempt_status" AS ENUM('pending', 'paid', 'failed');--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"transaction_id" text NOT NULL,
	"amount_minor" bigint NOT NULL,
	"currency" "currency" NOT NULL,
	"status" "payment_attempt_status" DEFAULT 'pending' NOT NULL,
	"review" text,
	"provider_response" jsonb,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_transaction_id_unique" UNIQUE("transaction_id"),
	CONSTRAINT "payments_amount_positive" CHECK ("payments"."amount_minor" > 0)
);
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payments_booking_idx" ON "payments" USING btree ("booking_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_one_pending_per_booking" ON "payments" USING btree ("booking_id") WHERE "payments"."status" = 'pending';