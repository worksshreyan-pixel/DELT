-- ------------------------------------------------------------------------------
-- 19. Deal Contracts & Contract Versions (Legal & Agreement Snapshots)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.deal_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL UNIQUE REFERENCES public.deals(id) ON DELETE CASCADE,
  current_version_id UUID,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'changes_requested', 'accepted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.contract_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.deal_contracts(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  version_number INT NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  terms_content TEXT NOT NULL,
  price_snapshot NUMERIC NOT NULL,
  currency_snapshot TEXT NOT NULL DEFAULT 'INR',
  deliverables_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  milestones_snapshot JSONB DEFAULT '[]'::jsonb,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  changes_requested_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  client_feedback TEXT,
  acceptance_metadata JSONB DEFAULT '{}'::jsonb
);

-- Unique version per contract
CREATE UNIQUE INDEX IF NOT EXISTS idx_contract_versions_unique_version 
  ON public.contract_versions(contract_id, version_number);

CREATE INDEX IF NOT EXISTS idx_deal_contracts_deal_id ON public.deal_contracts(deal_id);
CREATE INDEX IF NOT EXISTS idx_contract_versions_contract_id ON public.contract_versions(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_versions_deal_id ON public.contract_versions(deal_id);

-- Enable RLS
ALTER TABLE public.deal_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deal contracts managed by service role"
  ON public.deal_contracts FOR ALL
  USING (false);

CREATE POLICY "Contract versions managed by service role"
  ON public.contract_versions FOR ALL
  USING (false);
