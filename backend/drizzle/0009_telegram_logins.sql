CREATE TABLE "telegram_logins" (
	"hash" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "telegram_logins_expires_idx" ON "telegram_logins" USING btree ("expires_at");