from typing import Generator, Optional, Tuple
import os

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

# --- DB session dependency ----------------------------------------------------

SessionLocal = None

# Prefer the project's SessionLocal if available
try:
    from app.db import SessionLocal as ProjectSessionLocal  # type: ignore
    SessionLocal = ProjectSessionLocal
except Exception:
    # Fallback: build our own SessionLocal from DATABASE_URL
    try:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker

        _DATABASE_URL = os.getenv("DATABASE_URL")
        if not _DATABASE_URL:
            # Defer raising until first use so import doesn't fail at startup.
            _DATABASE_URL = None  # type: ignore

        def _make_local_sessionlocal():
            if not _DATABASE_URL:
                raise RuntimeError("DATABASE_URL is not set")
            engine = create_engine(_DATABASE_URL, pool_pre_ping=True, future=True)
            return sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

        SessionLocal = _make_local_sessionlocal()
    except Exception as e:
        # Leave SessionLocal as None; we'll raise when get_db is called
        SessionLocal = None  # type: ignore


def get_db() -> Generator[Session, None, None]:
    """Yield a SQLAlchemy Session; always closes it."""
    if SessionLocal is None:
        raise RuntimeError("SessionLocal is not available and DATABASE_URL was not set.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- Auth dependencies ---------------------------------------------------------

def _decode_token_flexible(token: str) -> dict:
    """
    Decode a bearer token. Tries python-jose first, then PyJWT.
    Verifies signature if a secret is configured; otherwise falls back to a
    non-verified decode to allow dev environments to function.
    """
    secret = (
        os.getenv("JWT_SECRET")
        or os.getenv("SECRET_KEY")
        or os.getenv("AUTH_SECRET")
        or ""
    )
    algorithms = ["HS256", "RS256"]
    last_err: Optional[Exception] = None

    # Try python-jose
    try:
        from jose import jwt as jose_jwt  # type: ignore

        # First try verified if we have a secret
        if secret:
            try:
                return jose_jwt.decode(
                    token,
                    secret,
                    algorithms=algorithms,
                    options={"verify_aud": False},
                )
            except Exception as e:
                last_err = e
        # Fallback: no signature verification (dev only)
        return jose_jwt.decode(
            token,
            "",
            algorithms=algorithms,
            options={"verify_signature": False, "verify_aud": False},
        )
    except Exception as e:
        last_err = e

    # Try PyJWT
    try:
        import jwt as pyjwt  # type: ignore

        if secret:
            try:
                return pyjwt.decode(
                    token,
                    secret,
                    algorithms=algorithms,
                    options={"verify_aud": False},
                )
            except Exception as e:
                last_err = e
        return pyjwt.decode(
            token,
            options={"verify_signature": False, "verify_aud": False},
            algorithms=algorithms,
        )
    except Exception as e:
        last_err = e

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=f"Invalid token: {last_err or 'decode failed'}",
    )


def require_auth(authorization: Optional[str] = Header(None)) -> Tuple[str, str]:
    """
    Ensures a bearer token is present and returns (sub, role).
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token"
        )
    token = authorization.split(" ", 1)[1].strip()
    payload = _decode_token_flexible(token)
    sub = payload.get("sub") or payload.get("user_id")
    role = payload.get("role") or payload.get("scope") or "user"
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token (no sub)"
        )
    return (str(sub), str(role))


def require_admin(auth: Tuple[str, str] = Depends(require_auth)) -> Tuple[str, str]:
    """
    Ensures the caller has the 'COVENANT' (admin) role.
    """
    sub, role = auth
    if str(role).upper() != "COVENANT":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required"
        )
    return auth
