from sqlalchemy import create_engine, text
candidates = [
    # add/remove as needed
    "azor",
    "Admin#DbPass#2025",
    "Admin#Passw0rd#2025#SetMeNow",
    ""
]
ok = []
for pwd in candidates:
    for dbname in ("azor","postgres"):
        url = f"postgresql+psycopg2://azor:{pwd}@127.0.0.1:5434/{dbname}"
        try:
            engine = create_engine(url, future=True)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            ok.append((pwd or "<empty>", dbname))
        except Exception as e:
            pass
print("SUCCESS:", ok if ok else "none")
