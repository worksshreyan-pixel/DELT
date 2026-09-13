-- ==============================================================================
-- Provider-Agnostic Storage Architecture
-- Creates storage_connections and storage_objects
-- Preserves legacy file_versions.files compatibility
-- ==============================================================================

-- 1. storage_connections (Tracks provider connections per user)
CREATE TABLE IF NOT EXISTS public.storage_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_type TEXT NOT NULL, -- 'DELT_MANAGED' | 'CUSTOMER_MANAGED'
    status TEXT NOT NULL DEFAULT 'connected',
    external_account_id TEXT,
    display_name TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    disconnected_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_storage_connections_user_id ON public.storage_connections(user_id);

-- 2. storage_objects (Tracks physical files independently of deliverables)
CREATE TABLE IF NOT EXISTS public.storage_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    deliverable_id UUID REFERENCES public.deliverables(id) ON DELETE SET NULL,
    file_version_id UUID REFERENCES public.file_versions(id) ON DELETE SET NULL,
    connection_id UUID REFERENCES public.storage_connections(id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    ownership_type TEXT NOT NULL, -- 'DELT_MANAGED' | 'CUSTOMER_MANAGED'
    external_object_id TEXT,
    external_url TEXT,
    object_path TEXT,
    name TEXT NOT NULL,
    mime_type TEXT,
    size BIGINT NOT NULL DEFAULT 0,
    checksum TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_storage_objects_deal_id ON public.storage_objects(deal_id);
CREATE INDEX IF NOT EXISTS idx_storage_objects_file_version_id ON public.storage_objects(file_version_id);

-- 3. Row Level Security (RLS)

ALTER TABLE public.storage_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_objects ENABLE ROW LEVEL SECURITY;

-- storage_connections Policies: Only the owning user can manage their connections.
CREATE POLICY "Users can manage their own storage connections" 
ON public.storage_connections 
FOR ALL 
USING (auth.uid() = user_id);

-- storage_objects Policies: Replicates the access model from file_versions.
-- Note: deal_id is used for relationship traversal.

-- Allow Deal Participants and Creators to view objects (SELECT)
CREATE POLICY "Deal participants can view storage objects" 
ON public.storage_objects 
FOR SELECT 
USING (
  deal_id IN (
    SELECT id FROM public.deals WHERE creator_id = auth.uid()
  ) OR
  deal_id IN (
    SELECT deal_id FROM public.deal_participants WHERE user_id = auth.uid()
  )
);

-- Allow Creators to fully manage (INSERT, UPDATE, DELETE) objects
CREATE POLICY "Creators can manage storage objects" 
ON public.storage_objects 
FOR ALL 
USING (
  deal_id IN (
    SELECT id FROM public.deals WHERE creator_id = auth.uid()
  )
);
