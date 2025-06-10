-- Add medical survey fields to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_hypertensive" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_cholesterol" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "smoking_amount" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "smoking_duration" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "height" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "weight" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_pregnant" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_sexually_active" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "sexual_partner_count" text;

-- Add medical survey fields to family_members table
ALTER TABLE "family_members" ADD COLUMN IF NOT EXISTS "is_hypertensive" boolean DEFAULT false;
ALTER TABLE "family_members" ADD COLUMN IF NOT EXISTS "is_cholesterol" boolean DEFAULT false;
ALTER TABLE "family_members" ADD COLUMN IF NOT EXISTS "smoking_amount" text;
ALTER TABLE "family_members" ADD COLUMN IF NOT EXISTS "smoking_duration" text;
ALTER TABLE "family_members" ADD COLUMN IF NOT EXISTS "height" text;
ALTER TABLE "family_members" ADD COLUMN IF NOT EXISTS "weight" text;
ALTER TABLE "family_members" ADD COLUMN IF NOT EXISTS "is_pregnant" boolean DEFAULT false;
ALTER TABLE "family_members" ADD COLUMN IF NOT EXISTS "is_sexually_active" boolean DEFAULT false;
ALTER TABLE "family_members" ADD COLUMN IF NOT EXISTS "sexual_partner_count" text; 