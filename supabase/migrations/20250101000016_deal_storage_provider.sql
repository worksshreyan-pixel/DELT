-- Add storage provider and storage connection reference to deals table
ALTER TABLE deals
ADD COLUMN storage_provider text NOT NULL DEFAULT 'supabase',
ADD COLUMN storage_connection_id uuid REFERENCES storage_connections(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_deals_storage_provider ON deals(storage_provider);
CREATE INDEX IF NOT EXISTS idx_deals_storage_connection_id ON deals(storage_connection_id);
