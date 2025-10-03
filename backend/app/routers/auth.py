# backend/app/routers/auth.py
from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import APIRouter, Depends, Form, Header, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db import get_session
from app.config import settings  # ⬅ unify all auth settings

router = APIRouter()

# ---- Use centralized config so tokens decode everywhere ----
JWT_SECRET = settings.JWT_SECRET or os.environ.get("JWT_SECRET", "devsecret-change-me")
JWT_ALG = settings.JWT_ALGORITHM or "HS256"
AUTH_COOKIE_NAME = settings.AUTH_COOKIE_NAME or "azor_access"
COOKIE_SECURE = bool(getattr(settings, "COOKIE_SECURE", False))
COOKIE_SAMESITE = getattr(settings, "COOKIE_SAMESITE", "Lax") or "Lax"
REQUIRE_MFA = settings.REQUIRE_MFA
MFA_BOOTSTRAP_ALLOW = settings.MFA_BOOTSTRAP_ALLOW

def _issue_token(sub: str, role: str, mfa_ok: bool) -> str:
    now = datetime.now(tz=timezone.utc)
    payload = {
        "sub": sub,
        "role": role,
        "mfa": mfa_ok,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=8)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def _set_auth_cookie(resp: JSONResponse, token: str, max_age_sec: int = 8 * 60 * 60) -> None:
    resp.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        secure=COOKIE_SECURE,
        httponly=True,
        samesite=COOKIE_SAMESITE,
        path="/",
        max_age=max_age_sec,
    )

@router.post("/token")
def login(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    mfa_code: Optional[str] = Form(None),
    x_mfa_code: Optional[str] = Header(None),
    db: Session = Depends(get_session),
):
    """
    Password + optional MFA login.

    Returns:
      - 200 {access_token, token_type, role} on success
      - 400 {"code":"mfa_code_required"} if MFA enabled and missing code
      - 400 {"code":"mfa_code_invalid"} if code doesn't verify
      - 400 {"code":"invalid_credentials"} if email/pass wrong
      - 200 {"mfa_enroll": true, access_token?} when MFA required but not enrolled (bootstrap)
    """
    email = (username or "").strip().lower()

    row = db.execute(
        text("SELECT id, password_hash, is_active, role FROM users WHERE email=:e LIMIT 1"),
        {"e": email},
    ).mappings().first()
    if not row or not row["is_active"]:
        return JSONResponse({"code": "invalid_credentials"}, status_code=400)

    try:
        ok = bcrypt.checkpw(password.encode("utf-8"), row["password_hash"].encode("utf-8"))
    except Exception:
        ok = False
    if not ok:
        return JSONResponse({"code": "invalid_credentials"}, status_code=400)

    user_id = str(row["id"])
    role = row["role"]

    cred = db.execute(
        text("SELECT secret, enabled FROM mfa_credential WHERE user_id=:u LIMIT 1"),
        {"u": user_id},
    ).mappings().first()

    # MFA enabled → require a valid code
    if cred and cred.get("enabled"):
        code = (mfa_code or x_mfa_code or "").strip()
        if not code:
            return JSONResponse({"code": "mfa_code_required"}, status_code=400)

        try:
            import pyotp
            totp = pyotp.TOTP(cred["secret"])
            if not totp.verify(code, valid_window=1):
                return JSONResponse({"code": "mfa_code_invalid"}, status_code=400)
        except Exception:
            return JSONResponse({"code": "mfa_code_invalid"}, status_code=400)

        token = _issue_token(user_id, role, mfa_ok=True)
        resp = JSONResponse({"access_token": token, "token_type": "bearer", "role": role})
        _set_auth_cookie(resp, token)
        return resp

    # Not enabled / not enrolled
    if REQUIRE_MFA:
        if not MFA_BOOTSTRAP_ALLOW:
            return JSONResponse({"code": "mfa_enrollment_required"}, status_code=403)
        # Bootstrap token so the user can enroll immediately
        token = _issue_token(user_id, role, mfa_ok=False)
        resp = JSONResponse({"mfa_enroll": True, "role": role, "access_token": token})
        _set_auth_cookie(resp, token, max_age_sec=15 * 60)  # 15 minutes
        return resp

    # MFA not globally required → normal session (mfa=false)
    token = _issue_token(user_id, role, mfa_ok=False)
    resp = JSONResponse({"access_token": token, "token_type": "bearer", "role": role})
    _set_auth_cookie(resp, token)
    return resp

@router.post("/logout")
def logout():
    resp = JSONResponse({"ok": True})
    resp.delete_cookie(AUTH_COOKIE_NAME, path="/")
    return resp

# ---------------- Password reset (DB-backed) ----------------

def _ensure_reset_table(db: Session):
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id uuid PRIMARY KEY,
            user_id uuid NOT NULL,
            token text NOT NULL,
            expires_at timestamptz NOT NULL,
            used boolean NOT NULL DEFAULT FALSE
        );
    """))
    db.commit()

@router.post("/request-password-reset")
def request_password_reset(payload: dict, db: Session = Depends(get_session)):
    email = (payload or {}).get("email", "").strip().lower()
    if not email:
        return {"ok": True}  # avoid user enumeration

    row = db.execute(
        text("SELECT id FROM users WHERE email=:e LIMIT 1"), {"e": email}
    ).mappings().first()
    if not row:
        return {"ok": True}

    _ensure_reset_table(db)
    token = uuid.uuid4().hex + uuid.uuid4().hex
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    db.execute(
        text("""INSERT INTO password_reset_tokens
                (id, user_id, token, expires_at, used)
                VALUES (:id, :uid, :t, :exp, FALSE)"""),
        {"id": str(uuid.uuid4()), "uid": str(row["id"]), "t": token, "exp": expires_at},
    )
    db.commit()

    res = {"ok": True}
    if os.environ.get("ENV", "dev") == "dev":
        res["dev_token"] = token
    return res

@router.post("/password-reset")
def password_reset(payload: dict, db: Session = Depends(get_session)):
    token = (payload or {}).get("token")
    new_password = (payload or {}).get("new_password")
    if not token or not new_password:
        return JSONResponse({"code": "invalid_request"}, status_code=400)

    _ensure_reset_table(db)
    row = db.execute(
        text("""SELECT user_id, expires_at, used
                FROM password_reset_tokens
                WHERE token=:t LIMIT 1"""),
        {"t": token},
    ).mappings().first()
    if not row or row["used"] or row["expires_at"] < datetime.now(timezone.utc):
        return JSONResponse({"code": "invalid_or_expired"}, status_code=400)

    hashed = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt(12)).decode("utf-8")
    db.execute(text("UPDATE users SET password_hash=:ph WHERE id=:uid"),
               {"ph": hashed, "uid": str(row["user_id"])})
    db.execute(text("UPDATE password_reset_tokens SET used=TRUE WHERE token=:t"),
               {"t": token})
    db.commit()
    return {"ok": True}
