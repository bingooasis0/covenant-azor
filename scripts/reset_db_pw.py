from sqlalchemy import create_engine, text
# USE THE *CURRENT* WORKING PASSWORD to connect (likely 'azor'). DB 'postgres' is OK for ALTER USER.
engine = create_engine('postgresql+psycopg2://azor:azor@127.0.0.1:5434/postgres', future=True)
with engine.begin() as conn:
    conn.execute(text("ALTER USER azor WITH PASSWORD 'Admin#DbPass#2025'"))
print('DB password for user azor updated to Admin#DbPass#2025')
