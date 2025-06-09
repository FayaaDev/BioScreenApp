-- Add medical survey fields to family_members table
ALTER TABLE "family_members"
ADD COLUMN "is_hypertensive" boolean DEFAULT false,
ADD COLUMN "is_smoker" boolean DEFAULT false,
ADD COLUMN "smoking_amount" text,
ADD COLUMN "smoking_duration" text,
ADD COLUMN "height" text,
ADD COLUMN "weight" text,
ADD COLUMN "is_pregnant" boolean DEFAULT false,
ADD COLUMN "is_sexually_active" boolean DEFAULT false,
ADD COLUMN "sexual_partner_count" text; 