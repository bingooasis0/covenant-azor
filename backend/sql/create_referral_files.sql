-- Create referral_files table for file attachments
CREATE TABLE IF NOT EXISTS referral_files (
    id UUID PRIMARY KEY,
    referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    content_type TEXT,
    storage_path TEXT,
    data BYTEA,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT referral_files_referral_fk FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE CASCADE
);

-- Index for faster lookups by referral
CREATE INDEX IF NOT EXISTS idx_referral_files_referral_id ON referral_files(referral_id);

-- Index for faster lookups by creation time
CREATE INDEX IF NOT EXISTS idx_referral_files_created_at ON referral_files(created_at DESC);
