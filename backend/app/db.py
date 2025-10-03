# backend/app/db.py
from __future__ import annotations

import os
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session

# Use DATABASE_URL from env; keep a sane default for local
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://azor:azor@127.0.0.1:55433/azor")
print(f"[DB] Using DATABASE_URL={DATABASE_URL}")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    future=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    future=True,
)

Base = declarative_base()

def get_session() -> Generator[Session, None, None]:
    """FastAPI dependency to yield a DB session (name kept for existing imports)."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Alias used by some routers
get_db = get_session
