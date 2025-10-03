from sqlalchemy import create_engine, text
import os
db = os.environ.get('DATABASE_URL','postgresql+psycopg2://azor:Admin%23DbPass%232025@127.0.0.1:5434/azor')
engine = create_engine(db, future=True)
with engine.connect() as conn:
    # columns (idempotent)
    conn.execute(text("ALTER TABLE referrals ADD COLUMN IF NOT EXISTS opportunity_types JSONB"))
    conn.execute(text("ALTER TABLE referrals ADD COLUMN IF NOT EXISTS locations JSONB"))
    conn.execute(text("ALTER TABLE referrals ADD COLUMN IF NOT EXISTS environment JSONB"))
    conn.execute(text("ALTER TABLE referrals ADD COLUMN IF NOT EXISTS reason TEXT"))
    # indexes (idempotent)
    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_referrals_agent_id ON referrals(agent_id)"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_referrals_created_at ON referrals(created_at)"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_referrals_status ON referrals(status)"))
    conn.commit()
print("Referral JSONB columns & indexes ensured.")
