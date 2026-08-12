-- ==============================================================================
-- DELT — Secure OTP Table & Closed Deal Status Support
-- Migration: 20250101000003_deal_otps.sql
-- ==============================================================================

-- 1. Deal OTP verification codes table
CREATE TABLE IF NOT EXISTS public.deal_otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_deal_otps_deal_email ON public.deal_otps(deal_id, email);
CREATE INDEX IF NOT EXISTS idx_deal_otps_expires_at ON public.deal_otps(expires_at);

ALTER TABLE public.deal_otps ENABLE ROW LEVEL SECURITY;

-- Service role full access; no direct public browser access
CREATE POLICY "Service role manages OTP codes"
  ON public.deal_otps FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
