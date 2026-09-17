-- Migration: 20250101000015_upload_sessions
-- Add default_storage_provider to profiles
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "default_storage_provider" text NOT NULL DEFAULT 'supabase' CHECK ("default_storage_provider" IN ('supabase', 'google_drive'));

-- Create upload_sessions table
CREATE TABLE IF NOT EXISTS "upload_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "deal_id" uuid NOT NULL REFERENCES "deals"("id") ON DELETE CASCADE,
  "deliverable_id" uuid NOT NULL REFERENCES "deliverables"("id") ON DELETE CASCADE,
  "provider" text NOT NULL,
  "session_uri" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'completed', 'failed')),
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_upload_sessions_deal_id" ON "upload_sessions"("deal_id");
CREATE INDEX IF NOT EXISTS "idx_upload_sessions_user_id" ON "upload_sessions"("user_id");
