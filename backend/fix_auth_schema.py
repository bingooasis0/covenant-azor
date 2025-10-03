import os, bcrypt
from sqlalchemy import create_engine, text

db = os.environ.get('DATABASE_URL', 'postgresql+psycopg2://azor:Admin%23DbPass%232025@127.0.0.1:5434/azor')
engine = create_engine(db, future=True)

def col_exists(conn, table, col):
    q = text("""
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = :t AND column_name = :c
        LIMIT 1
    """)
    return conn.execute(q, {"t": table, "c": col}).first() is not None

with engine.begin() as conn:
    # 1) add users.password_hash if missing
    if not col_exists(conn, "users", "password_hash"):
        conn.execute(text("ALTER TABLE users ADD COLUMN password_hash TEXT"))
        print("Added users.password_hash")

    # 2) copy from legacy columns if present
    if col_exists(conn, "users", "hashed_password"):
        conn.execute(text("""
            UPDATE users
            SET password_hash = hashed_password
            WHERE password_hash IS NULL AND hashed_password IS NOT NULL
        """))
    if col_exists(conn, "users", "password"):
        conn.execute(text("""
            UPDATE users
            SET password_hash = password
            WHERE password_hash IS NULL AND password IS NOT NULL
        """))

    # 3) seed/repair admin@test.local with bcrypt hash
    email = "admin@test.local"
    row = conn.execute(text("SELECT id, password_hash FROM users WHERE email=:e"), {"e": email}).first()
    hp = bcrypt.hashpw(b"Admin#Passw0rd#2025#SetMeNow", bcrypt.gensalt()).decode("utf-8")
    if row:
        if not row.password_hash:
            conn.execute(text("UPDATE users SET password_hash=:hp WHERE email=:e"), {"hp": hp, "e": email})
            print("Updated admin@test.local password_hash")
        else:
            print("Admin already exists with password_hash")
    else:
        conn.execute(text("""
            INSERT INTO users (id,email,first_name,last_name,role,password_hash)
            VALUES (gen_random_uuid(), :e, 'Admin','User','COVENANT', :hp)
        """), {"e": email, "hp": hp})
        print("Seeded admin@test.local")
