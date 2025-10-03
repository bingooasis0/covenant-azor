import os
import sqlalchemy as sa
import pytest

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://azor:azor@localhost:5432/azor")

REQUIRED_TABLES = {"users", "mfa_credential", "referrals", "audit_event"}

def test_required_tables_exist():
    engine = sa.create_engine(DATABASE_URL)
    insp = sa.inspect(engine)
    tables = set(insp.get_table_names())
    missing = REQUIRED_TABLES - tables
    assert not missing, f"Missing tables after migration: {missing}"
