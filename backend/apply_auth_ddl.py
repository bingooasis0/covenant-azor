from sqlalchemy import create_engine, text
import os
db = os.environ.get('DATABASE_URL', 'postgresql+psycopg2://azor:Admin%23DbPass%232025@127.0.0.1:5434/azor')
engine = create_engine(db, future=True)
with engine.connect() as conn:
    # Add column if missing, in its own autocommit tx
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT"))
    # If legacy column exists and is NOT NULL, relax it so future inserts don't fail
    try:
        conn.execute(text("ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL"))
    except Exception:
        pass
    conn.commit()
print("DDL applied")
