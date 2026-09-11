-- Add revision tracking fields to file_versions
ALTER TABLE file_versions 
ADD COLUMN IF NOT EXISTS client_feedback TEXT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
