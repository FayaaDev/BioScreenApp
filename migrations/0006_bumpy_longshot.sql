CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"last_login" timestamp,
	CONSTRAINT "admin_users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "educational_content" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "educational_content" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "educational_content" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "educational_content" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "screenings" ADD COLUMN "special_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_diabetic" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_hypertensive" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_smoker" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "smoking_amount" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "smoking_duration" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "height" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "weight" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_pregnant" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_sexually_active" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sexual_partner_count" varchar(10);