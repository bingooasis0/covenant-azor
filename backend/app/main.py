# backend/app/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import admin_referrals

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
    admin_extra,    # NEW: PATCH /admin/users/{id}, POST /admin/users/{id}/reset-password
    referral_files, # NEW: GET/POST/DELETE /referrals/{id}/files...
    announcements,  # NEW: GET/PUT /admin/announcements
)

APP_TITLE = "Covenant Azor Backend"
APP_VERSION = os.environ.get("AZOR_APP_VERSION", "dev")
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
]

app = FastAPI(title=APP_TITLE, version=APP_VERSION)
app.include_router(admin_referrals.router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
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

# Users (existing admin-facing user endpoints if any live here)
app.include_router(users.router, prefix="/users", tags=["users-admin"])

# Referrals (agent + shared)
app.include_router(referrals.router, prefix="/referrals", tags=["referrals"])

# Admin (existing)
app.include_router(admin.router, prefix="/admin", tags=["admin"])

# Admin extras (NEW) — do NOT add another prefix; module defines its own (/admin/…)
app.include_router(admin_extra.router)

# Referral files (NEW) — module defines /referrals/{id}/files…
app.include_router(referral_files.router)

# Announcements (NEW) — module defines /admin/announcements
app.include_router(announcements.router)

# Audit, metrics, support
app.include_router(audit.router, prefix="/audit", tags=["audit"])
app.include_router(metrics.router, prefix="/metrics", tags=["metrics"])
app.include_router(support.router, prefix="/support", tags=["support"])
