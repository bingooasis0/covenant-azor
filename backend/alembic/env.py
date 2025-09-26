from alembic import context
from sqlalchemy import create_engine, pool
import os, sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]  # backend/
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.database import Base
from app import models  # ensure models are imported

target_metadata = Base.metadata

def _db_url():
    return os.getenv("DATABASE_URL", "postgresql+psycopg://azor:azorpass@localhost:5434/azor")

def run_migrations_offline():
    context.configure(url=_db_url(), target_metadata=target_metadata, literal_binds=True, compare_type=True)
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    engine = create_engine(_db_url(), poolclass=pool.NullPool, pool_pre_ping=True)
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
