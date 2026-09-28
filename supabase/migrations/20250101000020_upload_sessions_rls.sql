-- ------------------------------------------------------------------------------
-- 20. Enable Row Level Security (RLS) on public.upload_sessions
-- ------------------------------------------------------------------------------

ALTER TABLE public.upload_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Upload sessions managed by service role"
  ON public.upload_sessions FOR ALL
  USING (false);
