# backend/app/deps/session.py
from __future__ import annotations

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import text
import jwt

from app.db import get_session
from app.config import settings

def _pick_token(request: Request) -> str | None:
    # 1) Authorization header
    auth = request.headers.get("authorization") or request.headers.get("Authorization")
    if auth:
        parts = auth.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return parts[1].strip()
        if " " not in auth and len(auth) > 20:  # tolerate raw JWT
            return auth.strip()

    # 2) Cookies (support common names)
    cookie_names = [
        getattr(settings, "AUTH_COOKIE_NAME", None) or "azor_access",
        "token", "access_token", "azor_token",
    ]
    for name in cookie_names:
        v = request.cookies.get(name)
        if v:
            return v
    return None

def require_session(request: Request, db: Session = Depends(get_session)):
    tok = _pick_token(request)
    if not tok:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    try:
        payload = jwt.decode(tok, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    uid = payload.get("sub")
    if not uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.execute(
        text("SELECT id, email, role, is_active FROM users WHERE id=:id LIMIT 1"),
        {"id": uid},
    ).mappings().first()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Login required")
    if user.get("is_active", True) is False:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User disabled")

    # NOTE: Do NOT enforce MFA here; bootstrap tokens (mfa=false) must reach /users/mfa/*
    return dict(user)
