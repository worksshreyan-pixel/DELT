-- DELT — Add completed_at column to milestones table
-- Migration: 20250101000021_milestones_completed_at.sql

ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
