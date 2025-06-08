-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations

CREATE TABLE "screenings" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"gender_applicable" text NOT NULL,
	"start_age" integer NOT NULL,
	"end_age" integer,
	"frequency_years" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"icon_url" text,
	"priority" text DEFAULT 'recommended' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_screenings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"screening_id" integer NOT NULL,
	"last_completed" text,
	"next_due" text NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text DEFAULT 'temp_password' NOT NULL,
	"gender" varchar(10) NOT NULL,
	"date_of_birth" text NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" text NOT NULL,
	"username" text,
	CONSTRAINT "users_username_key" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "family_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"relationship" text NOT NULL,
	"gender" varchar(10) NOT NULL,
	"date_of_birth" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_member_screenings" (
	"id" serial PRIMARY KEY NOT NULL,
	"family_member_id" integer NOT NULL,
	"screening_id" integer NOT NULL,
	"last_completed" text,
	"next_due" text NOT NULL,
	"status" text NOT NULL,
	"created_at" text NOT NULL
);