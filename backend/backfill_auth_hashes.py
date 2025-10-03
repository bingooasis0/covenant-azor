import os, bcrypt
from sqlalchemy import create_engine, text
db = os.environ.get('DATABASE_URL', 'postgresql+psycopg2://azor:Admin%23DbPass%232025@127.0.0.1:5434/azor')
engine = create_engine(db, future=True)

def col_exists(conn, table, col):
    q = text(\"\"\"
        SELECT 1 FROM information_schema.columns
        WHERE table_name=:t AND column_name=:c
        LIMIT 1
    \"\"\")
    return conn.execute(q, {"t": table, "c": col}).first() is not None

with engine.begin() as conn:
    # Copy legacy into new column where missing
    if col_exists(conn, "users", "hashed_password"):
        conn.execute(text(\"\"\"
            UPDATE users
            SET password_hash = hashed_password
            WHERE password_hash IS NULL AND hashed_password IS NOT NULL
        \"\"\"))

    if col_exists(conn, "users", "password"):
        conn.execute(text(\"\"\"
            UPDATE users
            SET password_hash = password
            WHERE password_hash IS NULL AND password IS NOT NULL
        \"\"\"))

    # Seed/repair admin with bcrypt in BOTH columns (to satisfy any old NOT NULL paths)
    email = "admin@test.local"
    hp = bcrypt.hashpw(b"Admin#Passw0rd#2025#SetMeNow", bcrypt.gensalt()).decode("utf-8")

    row = conn.execute(text("SELECT id FROM users WHERE email=:e"), {"e": email}).first()
    if row:
        # set both columns for safety if they exist
        if col_exists(conn, "users", "password_hash"):
            conn.execute(text("UPDATE users SET password_hash=:hp WHERE email=:e"), {"hp": hp, "e": email})
        if col_exists(conn, "users", "hashed_password"):
            conn.execute(text("UPDATE users SET hashed_password=:hp WHERE email=:e"), {"hp": hp, "e": email})
        print("Updated admin@test.local hashes")
    else:
        # insert both columns if legacy exists
        cols = "(id,email,first_name,last_name,role,password_hash"
        vals = "(gen_random_uuid(), :e, 'Admin','User','COVENANT', :hp"
        if col_exists(conn, "users", "hashed_password"):
            cols += ",hashed_password"
            vals += ",:hp"
        cols += ")"
        vals += ")"
        conn.execute(text(f"INSERT INTO users {cols} VALUES {vals}"), {"e": email, "hp": hp})
        print("Seeded admin@test.local")
print("Backfill/seed complete")
