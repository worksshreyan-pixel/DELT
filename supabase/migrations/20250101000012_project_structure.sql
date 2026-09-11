-- ==============================================================================
-- DELT — Project Structure
-- Migration: 20250101000012_project_structure.sql
-- ==============================================================================

ALTER TABLE public.deals 
ADD COLUMN project_structure TEXT NOT NULL DEFAULT 'scope_and_milestones';
