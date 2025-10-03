-- Add metadata column to audit_event table to store change details
ALTER TABLE audit_event ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_event_metadata ON audit_event USING gin(metadata);
