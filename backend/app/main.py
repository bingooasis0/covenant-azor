# backend/app/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Routers
from app.routers import (
    auth,
    me,
    users,
    referrals,
    admin,          # existing admin routes
    audit,
    metrics,
    support,
    mfa,
    admin_extra,    # PATCH /admin/users/{id}, POST /admin/users/{id}/reset-password
    referral_files, # /referrals/{id}/files...
    announcements,  # /admin/announcements
    admin_referrals # <-- this module's router already has prefix="/admin"
)

APP_TITLE = "Covenant Azor Backend"
APP_VERSION = os.environ.get("AZOR_APP_VERSION", "dev")

app = FastAPI(title=APP_TITLE, version=APP_VERSION)

# CORS (single middleware, includes both localhost & 127.0.0.1)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health + version
@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}

@app.get("/version", tags=["meta"])
def version():
    return {"version": APP_VERSION}

# MFA (self-service)
app.include_router(mfa.router, prefix="/users/mfa", tags=["mfa"])

# Auth + account
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(me.router, prefix="/users", tags=["users"])

# Users (if you have admin-facing user endpoints living under /users)
app.include_router(users.router, prefix="/users", tags=["users-admin"])

# Referrals (agent + shared)
app.include_router(referrals.router, prefix="/referrals", tags=["referrals"])

# Admin (existing)
app.include_router(admin.router, prefix="/admin", tags=["admin"])

# Admin extras (module defines /admin/... inside the module)
app.include_router(admin_extra.router)

# Admin referrals — DO NOT add another prefix here; the module already sets prefix="/admin"
app.include_router(admin_referrals.router, tags=["admin"])

# Referral files (module defines /referrals/{id}/files…)
app.include_router(referral_files.router)

# Announcements (module defines /admin/announcements)
app.include_router(announcements.router)

# Audit, metrics, support
app.include_router(audit.router, prefix="/audit", tags=["audit"])
app.include_router(metrics.router, prefix="/metrics", tags=["metrics"])
app.include_router(support.router, prefix="/support", tags=["support"])
