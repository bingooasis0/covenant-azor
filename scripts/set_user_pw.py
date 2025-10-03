import os, bcrypt
from sqlalchemy import create_engine, text

DB = os.environ.get("DATABASE_URL", "postgresql+psycopg2://azor:Admin%23DbPass%232025@127.0.0.1:5434/azor")
engine = create_engine(DB, future=True)

# EDIT the emails you want active:
emails = [
    "admin@test.local",                   # test admin
    "colby@covenanttechnology.net",       # your real login if you prefer
]

# EDIT the password you will use to log in:
plain = "Admin#Passw0rd#2025#SetMeNow"

hp = bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

with engine.begin() as conn:
    # Ensure password_hash column exists (no harm if it already does)
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT"))
    # If legacy column 'hashed_password' exists and is NOT NULL-only, drop NOT NULL to avoid future conflicts
    try:
        conn.execute(text("ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL"))
    except Exception:
        pass

    for email in emails:
        row = conn.execute(text("SELECT id FROM users WHERE email=:e"), {"e": email}).first()
        if row:
            conn.execute(text("UPDATE users SET password_hash=:hp WHERE email=:e"), {"hp": hp, "e": email})
            # also update legacy column if present
            try:
                conn.execute(text("UPDATE users SET hashed_password=:hp WHERE email=:e"), {"hp": hp, "e": email})
            except Exception:
                pass
            print(f"Updated {email}")
        else:
            # insert both columns if legacy exists; otherwise insert password_hash only
            legacy = False
            try:
                conn.execute(text("SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='hashed_password'"))
                legacy = True
            except Exception:
                pass
            if legacy:
                conn.execute(
                    text("INSERT INTO users (id,email,first_name,last_name,role,password_hash,hashed_password) VALUES (gen_random_uuid(), :e, 'Admin','User','COVENANT', :hp, :hp)"),
                    {"e": email, "hp": hp},
                )
            else:
                conn.execute(
                    text("INSERT INTO users (id,email,first_name,last_name,role,password_hash) VALUES (gen_random_uuid(), :e, 'Admin','User','COVENANT', :hp)"),
                    {"e": email, "hp": hp},
                )
            print(f"Seeded {email}")
print("Done.")
