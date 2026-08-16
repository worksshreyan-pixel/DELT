-- ==============================================================================
-- DELT — Add Deal-Level Preview Enabled Setting
-- Migration: 20250101000004_add_preview_enabled.sql
-- ==============================================================================

ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS preview_enabled BOOLEAN NOT NULL DEFAULT false;
