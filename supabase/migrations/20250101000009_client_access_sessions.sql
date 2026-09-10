-- ------------------------------------------------------------------------------
-- 9. Client Access Sessions (Persistent Client Authentication)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.client_access_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  client_email TEXT NOT NULL,
  session_token_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_client_access_sessions_deal_id ON public.client_access_sessions(deal_id);
CREATE INDEX IF NOT EXISTS idx_client_access_sessions_email ON public.client_access_sessions(client_email);
CREATE INDEX IF NOT EXISTS idx_client_access_sessions_hash ON public.client_access_sessions(session_token_hash);

ALTER TABLE public.client_access_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client access sessions are fully managed by service role"
  ON public.client_access_sessions FOR ALL
  USING (false);

