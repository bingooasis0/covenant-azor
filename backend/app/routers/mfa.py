
# backend/app/routers/mfa.py
import os
from typing import Optional
from io import BytesIO
from datetime import datetime, timezone

import jwt
import qrcode
import pyotp
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db import get_session

router = APIRouter()

JWT_SECRET = os.environ.get("JWT_SECRET", "devsecret-change-me")
JWT_ALG = "HS256"
AUTH_COOKIE_NAME = os.environ.get("AUTH_COOKIE_NAME", "azor_access")
MFA_ISSUER = os.environ.get("MFA_ISSUER", "Azor")

def _read_token_from_request(req: Request) -> Optional[str]:
    # Authorization header takes precedence
    auth = req.headers.get("authorization")
    if auth and auth.lower().startswith("bearer "):
        return auth[7:]
    # Fallback to cookie
    return req.cookies.get(AUTH_COOKIE_NAME)

def _require_user(req: Request):
    token = _read_token_from_request(req)
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except Exception:
        return None
    return payload  # contains sub, role, mfa flag

def _qr_data_uri(otpauth_url: str) -> str:
    img = qrcode.make(otpauth_url)
    buf = BytesIO()
    img.save(buf, format="PNG")
    import base64
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")

@router.post("/setup")
def mfa_setup(request: Request, db: Session = Depends(get_session)):
    payload = _require_user(request)
    if not payload:
        return JSONResponse({"code": "unauthorized"}, status_code=401)
    uid = payload["sub"]

    # get or create secret for this user
    row = db.execute(
        text("SELECT secret, verified, enabled FROM mfa_credential WHERE user_id=:u LIMIT 1"),
        {"u": uid}
    ).fetchone()

    if row and row.secret:
        secret = row.secret
    else:
        secret = pyotp.random_base32()
        db.execute(
            text("INSERT INTO mfa_credential (user_id, secret, verified, enabled) VALUES (:u, :s, FALSE, FALSE) "
                 "ON CONFLICT (user_id) DO UPDATE SET secret=:s"),
            {"u": uid, "s": secret}
        )
        db.commit()

    # otpauth URL
    # (email is not stored in token payload; fetch it)
    urow = db.execute(text("SELECT email FROM users WHERE id=:u"), {"u": uid}).fetchone()
    label = urow.email if urow and urow.email else uid
    totp = pyotp.TOTP(secret)
    otpauth_url = totp.provisioning_uri(name=label, issuer_name=MFA_ISSUER)
    qr = _qr_data_uri(otpauth_url)

    return {"otpauth_url": otpauth_url, "qr": qr, "secret": secret, "recovery_codes": []}

@router.post("/verify")
def mfa_verify(request: Request, payload: dict, db: Session = Depends(get_session)):
    body_code = (payload or {}).get("code", "")
    token_payload = _require_user(request)
    if not token_payload:
        return JSONResponse({"code": "unauthorized"}, status_code=401)

    uid = token_payload["sub"]
    row = db.execute(
        text("SELECT secret FROM mfa_credential WHERE user_id=:u LIMIT 1"),
        {"u": uid}
    ).fetchone()
    if not row:
        return JSONResponse({"code": "mfa_setup_required"}, status_code=400)

    totp = pyotp.TOTP(row.secret)
    if not totp.verify(str(body_code).strip(), valid_window=1):
        return JSONResponse({"code": "mfa_code_invalid"}, status_code=400)

    db.execute(
        text("UPDATE mfa_credential SET verified=TRUE, enabled=TRUE WHERE user_id=:u"),
        {"u": uid}
    )
    db.commit()
    return {"ok": True}

@router.post("/reset")
def mfa_reset(request: Request, db: Session = Depends(get_session)):
    payload = _require_user(request)
    if not payload:
        return JSONResponse({"code": "unauthorized"}, status_code=401)
    uid = payload["sub"]
    db.execute(
        text("DELETE FROM mfa_credential WHERE user_id=:u"),
        {"u": uid}
    )
    db.commit()
    return {"ok": True}
