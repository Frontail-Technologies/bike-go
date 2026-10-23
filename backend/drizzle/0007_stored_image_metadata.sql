ALTER TABLE "banners" ADD COLUMN "image_content_type" text DEFAULT 'image/jpeg' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicle_images" ADD COLUMN "content_type" text;--> statement-breakpoint
ALTER TABLE "vehicle_images" ADD COLUMN "size_bytes" integer;