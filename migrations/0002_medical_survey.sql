-- Migration: Add medical survey fields to users table
-- Tag: 0002_medical_survey

ALTER TABLE "users" ADD COLUMN "is_diabetic" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN "is_hypertensive" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN "is_smoker" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN "smoking_amount" text;
ALTER TABLE "users" ADD COLUMN "smoking_duration" text;
ALTER TABLE "users" ADD COLUMN "height" text;
ALTER TABLE "users" ADD COLUMN "weight" text;
ALTER TABLE "users" ADD COLUMN "is_pregnant" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN "is_sexually_active" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN "sexual_partner_count" varchar(10); 