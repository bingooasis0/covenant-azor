import os, re, sys
from pathlib import Path
from sqlalchemy import create_engine, text

def main():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("ERROR: DATABASE_URL env var is required.", file=sys.stderr)
        sys.exit(1)

    # Find the SQL file relative to this script:
    # repo_root/migrations/20251001_backend_patch.sql
    script_dir = Path(__file__).resolve().parent
    sql_path = (script_dir.parent.parent / "migrations" / "20251001_backend_patch.sql").resolve()
    if not sql_path.exists():
        print(f"ERROR: SQL file not found: {sql_path}", file=sys.stderr)
        sys.exit(2)

    engine = create_engine(db_url, future=True)
    sql_text = sql_path.read_text(encoding="utf-8")

    # Very simple splitter; our file has no functions/triggers.
    statements = [s.strip() for s in re.split(r";\s*(?:\n|$)", sql_text) if s.strip()]

    applied = 0
    with engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))
            applied += 1

    print(f"Applied {applied} statements from {sql_path.name}.")

if __name__ == "__main__":
    main()
