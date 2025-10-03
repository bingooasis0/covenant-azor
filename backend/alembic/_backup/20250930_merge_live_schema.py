"""Merge live schema: users.password_hash, referrals JSONB fields, indexes.

This migration is idempotent (uses IF NOT EXISTS) to align fresh DBs with the
schema currently deployed.

IMPORTANT: set down_revision to your CURRENT heads tuple.
Run `alembic heads` and replace ('HEAD_A','HEAD_B',...) below accordingly.
"""
from alembic import op
import sqlalchemy as sa

# Revision identifiers, used by Alembic.
revision = "20250930_merge_live_schema"
down_revision = ('PUT_YOUR_CURRENT_HEADS_HERE',)  # e.g. ('0002_audit', '0003_mfa')
branch_labels = None
depends_on = None

def upgrade():
    conn = op.get_bind()

    # --- users.password_hash ---
    conn.execute(sa.text("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT"))

    # Relax legacy NOT NULL on hashed_password if present
    try:
        conn.execute(sa.text("ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL"))
    except Exception:
        pass

    # --- referrals JSONB/text fields ---
    conn.execute(sa.text("ALTER TABLE referrals ADD COLUMN IF NOT EXISTS opportunity_types JSONB"))
    conn.execute(sa.text("ALTER TABLE referrals ADD COLUMN IF NOT EXISTS locations JSONB"))
    conn.execute(sa.text("ALTER TABLE referrals ADD COLUMN IF NOT EXISTS environment JSONB"))
    conn.execute(sa.text("ALTER TABLE referrals ADD COLUMN IF NOT EXISTS reason TEXT"))

    # --- indexes (idempotent) ---
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_referrals_agent_id ON referrals(agent_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_referrals_created_at ON referrals(created_at)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_referrals_status ON referrals(status)"))

def downgrade():
    # No-op: live schema merge; do not drop columns in downgrade.
    pass
