from sqlalchemy import create_engine, text
engine = create_engine('postgresql+psycopg2://azor:azor@127.0.0.1:5434/postgres', future=True)
with engine.begin() as conn:
    conn.execute(text("SELECT 1"))
    conn.execute(text("DO head BEGIN IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname='azor') THEN PERFORM dblink_exec('dbname=postgres','CREATE DATABASE azor'); END IF; EXCEPTION WHEN undefined_function THEN NULL; END head;"))
print('DB check done')
