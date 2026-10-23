CREATE TYPE "public"."banner_placement" AS ENUM('home_hero', 'home_promo', 'vehicles', 'expat_loan');--> statement-breakpoint
CREATE TYPE "public"."banner_status" AS ENUM('active', 'scheduled', 'inactive', 'expired');--> statement-breakpoint
CREATE TABLE "banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"image_storage_key" text NOT NULL,
	"image_url" text,
	"cta_label" text,
	"cta_url" text,
	"placement" "banner_placement" NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"status" "banner_status" DEFAULT 'active' NOT NULL,
	"start_at" timestamp with time zone,
	"end_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "banners_window_valid" CHECK ("banners"."start_at" IS NULL OR "banners"."end_at" IS NULL OR "banners"."end_at" > "banners"."start_at")
);
--> statement-breakpoint
CREATE INDEX "banners_placement_order_idx" ON "banners" USING btree ("placement","display_order");--> statement-breakpoint
CREATE INDEX "banners_status_idx" ON "banners" USING btree ("status");--> statement-breakpoint
CREATE INDEX "banners_display_order_idx" ON "banners" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "banners_window_idx" ON "banners" USING btree ("start_at","end_at");