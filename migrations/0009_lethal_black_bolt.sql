ALTER TABLE "screenings" ADD COLUMN "key" text;--> statement-breakpoint
ALTER TABLE "screenings" ADD COLUMN "articulation" text;--> statement-breakpoint
ALTER TABLE "screenings" ADD CONSTRAINT "screenings_key_unique" UNIQUE("key");