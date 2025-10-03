import os, bcrypt
from sqlalchemy import create_engine, text
db = os.environ.get('DATABASE_URL', 'postgresql+psycopg2://azor:Admin%23DbPass%232025@127.0.0.1:5434/azor')
engine = create_engine(db, future=True)
email='admin@test.local'
pwd='Admin#Passw0rd#2025#SetMeNow'
hp = bcrypt.hashpw(pwd.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
with engine.begin() as conn:
    row = conn.execute(text('SELECT 1 FROM users WHERE email=:e'), {'e': email}).first()
    if not row:
        conn.execute(text("""
            INSERT INTO users (id,email,first_name,last_name,role,password_hash)
            VALUES (gen_random_uuid(), :e, 'Admin','User','COVENANT', :hp)
        """), {'e': email, 'hp': hp})
        print('Seeded admin@test.local')
    else:
        print('Admin already exists')
