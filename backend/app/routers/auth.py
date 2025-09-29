# backend/app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db import get_session
import app.utils as utils  # optional helpers (verify/create token) if present
from app.config import settings
import os
import datetime

router = APIRouter()

_PASSWORD_COL = None  # cache detected password column name


def _detect_password_column(db: Session) -> str:
    """Find an existing password column on users table."""
    global _PASSWORD_COL
    if _PASSWORD_COL:
        return _PASSWORD_COL
    for c in ("password_hash", "hashed_password", "password"):
        q = text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_name = 'users' AND column_name = :c LIMIT 1"
        )
        if db.execute(q, {"c": c}).first():
            _PASSWORD_COL = c
            return c
    _PASSWORD_COL = ""  # none found
    return _PASSWORD_COL


def _verify_password(plain: str, hashed: str) -> bool:
    """Try utils helpers first, fall back to passlib bcrypt if available."""
    for name in ("verify_password", "check_password", "verify", "checkpw"):
        fn = getattr(utils, name, None)
        if fn:
            try:
                return bool(fn(plain, hashed))
            except TypeError:
                try:
                    return bool(fn(plain_password=plain, hashed_password=hashed))
                except TypeError:
                    pass
    try:
        from passlib.hash import bcrypt
        return bcrypt.verify(plain, hashed)
    except Exception:
        return False


def _create_access_token(sub: str, role: str) -> str:
    """
    Issue a JWT using the SAME secret/algorithm that the verifier uses.
    Falls back to settings, then env, defaults to HS256.
    """
    # Try project helpers first
    for name in ("create_access_token", "create_token", "issue_token", "make_access_token"):
        fn = getattr(utils, name, None)
        if fn:
            try:
                return fn(sub=sub, role=role)
            except TypeError:
                try:
                    return fn(sub, role)
                except TypeError:
                    pass

    # Minimal PyJWT fallback aligned with settings used by /users/me
    try:
        import jwt  # pyjwt
    except Exception:
        raise HTTPException(status_code=500, detail="Token generator not found")

    secret = getattr(settings, "JWT_SECRET", None) or os.environ.get("JWT_SECRET", "devsecret")
    alg = getattr(settings, "JWT_ALGORITHM", None) or "HS256"

    exp = datetime.datetime.utcnow() + datetime.timedelta(hours=12)
    payload = {"sub": sub, "role": role, "exp": exp}
    return jwt.encode(payload, secret, algorithm=alg)


@router.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_session)):
    col = _detect_password_column(db)
    if not col:
        # No recognized password column present
        raise HTTPException(status_code=400, detail="Invalid credentials")

    row = db.execute(
        text(
            f"SELECT id, email, role, {col} AS hashed_password "
            "FROM users WHERE email = :email LIMIT 1"
        ),
        {"email": form_data.username},
    ).first()

    if not row:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    user = dict(row._mapping)
    if not user.get("hashed_password") or not _verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = _create_access_token(sub=str(user["id"]), role=user["role"])
    return {"access_token": token, "token_type": "bearer", "role": user["role"]}
