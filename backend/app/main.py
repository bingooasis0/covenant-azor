from __future__ import annotations
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from fastapi.routing import APIRoute
from app.routers import me as me_router
from app.routers import users

app = FastAPI(title="Azor API")
app.include_router(me_router.router, prefix="/users", include_in_schema=False)
app.include_router(users.router)

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
app.add_middleware(CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN, "http://127.0.0.1:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

try:
    from app.middleware.log_json import LogJSONMiddleware
    app.add_middleware(LogJSONMiddleware)
except Exception:
    print("[main] log_json middleware not loaded")

def _include_router(module_path: str) -> None:
    try:
        mod = __import__(module_path, fromlist=["router"])
        r = getattr(mod, "router", None)
        if r is not None:
            app.include_router(r)  # avoid extra prefix
            print(f"[main] Router loaded: {module_path}")
    except Exception as ex:
        print(f"[main] Router skipped {module_path}: {ex}")

for path in [
    "app.routers.auth",
    "app.routers.me",
    "app.routers.users",
    "app.routers.referrals",
    "app.routers.referrals_extras",
    "app.routers.admin_referrals",
    "app.routers.admin_users",
    "app.routers.admin_test",
    "app.routers.audit",
    "app.routers.announcements",
    "app.routers.admin_announcements",
    "app.routers.feedback",
]:
    _include_router(path)

@app.get("/healthz")
def healthz():
    return {"ok": True}

@app.get("/ping")
def ping():
    return {"ok": True}

@app.get("/health/ready")
def health_ready():
    return {"ok": True}

def _ensure_alias(path: str, method: str, candidates: list[str]):
    def find(p: str):
        for route in app.routes:
            if isinstance(route, APIRoute) and route.path == p and method in (route.methods or []):
                return route
        return None
    if find(path) is None:
        for c in candidates:
            src = find(c)
            if src is not None:
                app.add_api_route(path, src.endpoint, methods=[method], include_in_schema=False, name=f"alias:{path}")
                print(f"[main] Added alias {path} -> {c}")
                break

# make sure frontend-required auth endpoints exist
_ensure_alias("/auth/token", "POST", ["/token", "/api/auth/token", "/api/token"])
_ensure_alias("/auth/logout", "POST", ["/logout", "/api/auth/logout"])
_ensure_alias("/auth/request-password-reset", "POST", ["/request-password-reset", "/api/auth/request-password-reset"])
_ensure_alias("/auth/password-reset", "POST", ["/password-reset", "/api/auth/password-reset"])

def _ensure_schema():
    url = os.getenv("DATABASE_URL")
    if not url:
        print("[DB] No DATABASE_URL; skipping ensure_schema")
        return
    print(f"[DB] Using DATABASE_URL={url}")
    eng = create_engine(url, future=True)
    stmts = [
        "ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS first_name text",
        "ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS last_name text",
        "ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS role text DEFAULT 'AZOR'",
        "ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS company text",
        "ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS status text DEFAULT 'NEW'",
        "ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now()",
        "ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS contact_name text",
        "ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS contact_email text",
        "ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS contact_phone text",
        "ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS notes text",
        "ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS agent_id uuid",
        "ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS opportunity_types text[]",
        "ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS locations text[]",
        "ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS environment text",
        "ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS reason text",
        "ALTER TABLE IF EXISTS referrals ADD COLUMN IF NOT EXISTS ref_no text",
        "CREATE UNIQUE INDEX IF NOT EXISTS referrals_ref_no_idx ON referrals(ref_no)",
        "UPDATE referrals SET ref_no = UPPER(SUBSTRING(id::text,1,8)) WHERE ref_no IS NULL",
        """CREATE TABLE IF NOT EXISTS feedback_files (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid NOT NULL,
            name text NOT NULL,
            size_bytes bigint NOT NULL,
            content_type text,
            data bytea NOT NULL,
            metadata jsonb,
            created_at timestamptz DEFAULT now()
        )""",
        "ALTER TABLE IF EXISTS referral_files ADD COLUMN IF NOT EXISTS data bytea",
    ]
    try:
        with eng.begin() as conn:
            for s in stmts:
                conn.execute(text(s))
        print("[DB] ensure_schema complete")
    except Exception as ex:
        print(f"[DB] ensure_schema skipped: {ex}")

@app.on_event("startup")
def _startup():
    _ensure_schema()
