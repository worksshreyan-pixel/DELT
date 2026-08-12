-- ==============================================================================
-- DELT — Production Database Schema & RLS Policies
-- Migration: 20250101000001_initial_schema.sql
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Profiles (linked to auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  profession TEXT,
  company TEXT,
  website TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 2. Storage Usage & Deal Credits (Entitlements)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.storage_usage (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_bytes BIGINT NOT NULL DEFAULT 0,
  limit_bytes BIGINT NOT NULL DEFAULT 1073741824, -- 1 GB for free plan
  files_bytes BIGINT NOT NULL DEFAULT 0,
  versions_bytes BIGINT NOT NULL DEFAULT 0,
  attachments_bytes BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.storage_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own storage usage"
  ON public.storage_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.deal_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL DEFAULT 'free',
  total INT NOT NULL DEFAULT 1,
  used INT NOT NULL DEFAULT 0,
  remaining INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.deal_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deal credits"
  ON public.deal_credits FOR SELECT
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 3. Clients Directory
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  deal_count INT NOT NULL DEFAULT 0,
  total_value NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'active',
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_clients_creator_id ON public.clients(creator_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can manage their own clients"
  ON public.clients FOR ALL
  USING (auth.uid() = creator_id);

-- ------------------------------------------------------------------------------
-- 4. Deals Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT NOT NULL UNIQUE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scope JSONB NOT NULL DEFAULT '[]'::jsonb,
  price NUMERIC NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'in_progress',
  deadline TIMESTAMPTZ,
  progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  payment_status TEXT NOT NULL DEFAULT 'pending',
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_deals_creator_id ON public.deals(creator_id);
CREATE INDEX IF NOT EXISTS idx_deals_token ON public.deals(token);
CREATE INDEX IF NOT EXISTS idx_deals_client_email ON public.deals(client_email);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can manage their own deals"
  ON public.deals FOR ALL
  USING (auth.uid() = creator_id);

CREATE POLICY "Clients can view deals via token query"
  ON public.deals FOR SELECT
  USING (true);

-- ------------------------------------------------------------------------------
-- 5. Deal Participants
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.deal_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('creator', 'client')),
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_deal_participants_deal_id ON public.deal_participants(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_participants_email ON public.deal_participants(email);

ALTER TABLE public.deal_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deal participants are viewable by creator or participant"
  ON public.deal_participants FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.deals WHERE deals.id = deal_participants.deal_id AND deals.creator_id = auth.uid())
    OR auth.uid() = user_id
    OR true
  );

-- ------------------------------------------------------------------------------
-- 6. Deal Messages (Chat)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.deal_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('creator', 'client')),
  sender_avatar_url TEXT,
  type TEXT NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  proposal_id UUID,
  attachments JSONB DEFAULT '[]'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_deal_messages_deal_id ON public.deal_messages(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_messages_created_at ON public.deal_messages(created_at);

ALTER TABLE public.deal_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deal participants can read messages"
  ON public.deal_messages FOR SELECT
  USING (true);

CREATE POLICY "Deal participants can send messages"
  ON public.deal_messages FOR INSERT
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 7. Price Proposals (Negotiation)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.price_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('creator_to_client', 'client_to_creator')),
  previous_price NUMERIC NOT NULL,
  proposed_price NUMERIC NOT NULL CHECK (proposed_price > 0),
  reason TEXT,
  state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'accepted', 'countered', 'declined', 'cancelled')),
  counter_proposal_id UUID REFERENCES public.price_proposals(id) ON DELETE SET NULL,
  proposed_by TEXT NOT NULL,
  proposed_by_name TEXT NOT NULL,
  proposed_by_role TEXT NOT NULL CHECK (proposed_by_role IN ('creator', 'client')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_price_proposals_deal_id ON public.price_proposals(deal_id);

ALTER TABLE public.price_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deal participants can view proposals"
  ON public.price_proposals FOR SELECT
  USING (true);

CREATE POLICY "Deal participants can insert proposals"
  ON public.price_proposals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Deal participants can update proposals"
  ON public.price_proposals FOR UPDATE
  USING (true);

-- ------------------------------------------------------------------------------
-- 8. Deliverables & File Versions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.deliverables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'uploaded', 'approved', 'changes_requested')),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_deliverables_deal_id ON public.deliverables(deal_id);

ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deal participants can view deliverables"
  ON public.deliverables FOR SELECT
  USING (true);

CREATE POLICY "Creators can manage deliverables"
  ON public.deliverables FOR ALL
  USING (true);

CREATE TABLE IF NOT EXISTS public.file_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deliverable_id UUID NOT NULL REFERENCES public.deliverables(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  description TEXT,
  uploader_id TEXT NOT NULL,
  uploader_name TEXT NOT NULL,
  files JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending_review',
  locked BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_file_versions_deal_id ON public.file_versions(deal_id);
CREATE INDEX IF NOT EXISTS idx_file_versions_deliverable_id ON public.file_versions(deliverable_id);

ALTER TABLE public.file_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deal participants can view file versions"
  ON public.file_versions FOR SELECT
  USING (true);

CREATE POLICY "Creators can manage file versions"
  ON public.file_versions FOR ALL
  USING (true);

-- ------------------------------------------------------------------------------
-- 9. Deal Events (Audit Timeline)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.deal_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  actor_id TEXT,
  actor_name TEXT,
  actor_role TEXT,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_deal_events_deal_id ON public.deal_events(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_events_created_at ON public.deal_events(created_at DESC);

ALTER TABLE public.deal_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deal participants can view events"
  ON public.deal_events FOR SELECT
  USING (true);

CREATE POLICY "Deal events can be created"
  ON public.deal_events FOR INSERT
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 10. Payments & Transactions (Razorpay)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  client_id TEXT,
  client_name TEXT NOT NULL,
  deal_title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  platform_fee NUMERIC NOT NULL DEFAULT 0,
  processing_fee NUMERIC NOT NULL DEFAULT 0,
  creator_net NUMERIC NOT NULL,
  state TEXT NOT NULL DEFAULT 'pending',
  method TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_deal_id ON public.payments(deal_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(razorpay_order_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payments viewable by creator or client"
  ON public.payments FOR SELECT
  USING (true);

CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  platform_fee NUMERIC NOT NULL DEFAULT 0,
  processing_fee NUMERIC NOT NULL DEFAULT 0,
  net_amount NUMERIC NOT NULL,
  state TEXT NOT NULL DEFAULT 'paid',
  date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_transactions_creator_id ON public.transactions(creator_id);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = creator_id);

-- ------------------------------------------------------------------------------
-- 11. Notifications
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  deal_title TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notifications"
  ON public.notifications FOR ALL
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 12. Auto User Creation Trigger (Profiles + Storage + Credits)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'displayName', split_part(new.email, '@', 1)),
    now(),
    now()
  );

  INSERT INTO public.storage_usage (user_id, total_bytes, limit_bytes, updated_at)
  VALUES (new.id, 0, 1073741824, now());

  INSERT INTO public.deal_credits (user_id, plan_id, total, used, remaining, updated_at)
  VALUES (new.id, 'free', 1, 0, 1, now());

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 13. Supabase Private Storage Setup
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'deal-files',
  'deal-files',
  false,
  104857600, -- 100 MB max file size
  ARRAY['image/*', 'application/pdf', 'application/zip', 'application/x-zip-compressed', 'video/*', 'application/octet-stream', 'text/*']
)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for deal-files
CREATE POLICY "Authenticated users can upload to deal-files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'deal-files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their deal files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'deal-files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read their deal files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'deal-files');
