-- ==============================================================================
-- DELT — Add Check Constraint & Schema Reload for Preview Mode
-- Migration: 20250101000018_preview_mode_check.sql
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'deals_preview_mode_check'
  ) THEN
    ALTER TABLE public.deals ADD CONSTRAINT deals_preview_mode_check CHECK (preview_mode IN ('AUTO', 'MANUAL', 'EXTERNAL', 'NONE'));
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
