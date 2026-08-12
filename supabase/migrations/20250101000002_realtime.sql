-- ==============================================================================
-- DELT — Realtime Publications Setup
-- Migration: 20250101000002_realtime.sql
-- ==============================================================================

-- Enable realtime on core tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.deal_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.price_proposals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deal_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliverables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.file_versions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
