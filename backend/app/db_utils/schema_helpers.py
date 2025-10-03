from typing import Iterable, Dict, List, Set
from sqlalchemy import text
from sqlalchemy.engine import Connection

def get_columns(conn: Connection, table: str) -> Set[str]:
    rows = conn.execute(
        text(
            "SELECT column_name FROM information_schema.columns WHERE table_name = :t"
        ),
        {"t": table},
    ).fetchall()
    return {r[0] for r in rows}

def pick_first(cols: set, candidates: List[str], default_expr: str = "NULL") -> str:
    """Return the first column from candidates that exists in cols as SQL expr; else default_expr."""
    for c in candidates:
        if c in cols:
            return c
    return default_expr

def aliased_expr(expr: str, alias: str) -> str:
    return f"{expr} AS {alias}"
