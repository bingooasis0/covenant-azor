-- Covenant-Azor patch — 2025-10-01
-- Minimal, idempotent DDL to satisfy frontend/admin expectations.

-- USERS
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS last_name  text;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS role       text DEFAULT 'user';

-- REFERRALS
ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS company           text;
ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS status            text DEFAULT 'new';
ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS created_at        timestamptz DEFAULT now();
ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS contact_name      text;
ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS contact_email     text;
ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS contact_phone     text;
ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS notes             text;
ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS agent_id          uuid;
ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS opportunity_types jsonb DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS locations         jsonb DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS environment       jsonb DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS reason            text;
ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS ref_no            text;

-- Backfill ref_no for existing rows
UPDATE referrals SET ref_no = UPPER(SUBSTRING(id::text,1,8)) WHERE ref_no IS NULL;

-- Unique index on ref_no
CREATE UNIQUE INDEX IF NOT EXISTS referrals_ref_no_idx ON referrals(ref_no);

-- AUDIT TABLE (ensure columns used in code exist)
-- Some deployments used 'event' instead of 'action'. Keep table if already present; otherwise create with 'action' column.
CREATE TABLE IF NOT EXISTS audit_events (
  id         BIGSERIAL PRIMARY KEY,
  user_id    uuid,
  action     text,
  meta       jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_events_created_idx ON audit_events(created_at DESC);
