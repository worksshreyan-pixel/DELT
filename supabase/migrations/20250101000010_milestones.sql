-- ==============================================================================
-- DELT — Milestones Table
-- Migration: 20250101000010_milestones.sql
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  "order" INT NOT NULL DEFAULT 0,
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_milestones_deal_id ON public.milestones(deal_id);

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deal participants can view milestones"
  ON public.milestones FOR SELECT
  USING (true);

CREATE POLICY "Creators can manage milestones"
  ON public.milestones FOR ALL
  USING (true);
