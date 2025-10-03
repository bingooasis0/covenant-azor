-- Enforce ownership and speed up lookups
ALTER TABLE referrals ALTER COLUMN agent_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_referrals_agent_id ON referrals(agent_id);
