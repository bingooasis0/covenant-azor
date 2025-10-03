# backend/app/utils/cookies.py
import os, time, datetime
from fastapi import Response

def _bool(envval: str | None, default: bool) -> bool:
    if envval is None: return default
    v = envval.strip().lower()
    if v in ("1","true","yes","y","on"): return True
    if v in ("0","false","no","n","off"): return False
    return default

def set_auth_cookie(response: Response, token: str):
    ttl = int(os.getenv("JWT_TTL_MIN", "30")) * 60
    secure = _bool(os.getenv("COOKIE_SECURE"), False)
    domain = os.getenv("COOKIE_DOMAIN") or ""
    same_site = os.getenv("COOKIE_SAMESITE", "Lax")
    # Name
    name = os.getenv("AUTH_COOKIE_NAME", "azor_access")
    # Expiry
    expires = int(time.time()) + ttl
    response.set_cookie(
        key=name,
        value=token,
        max_age=ttl,
        expires=expires,
        path="/",
        domain=domain or None,
        secure=secure,
        httponly=True,
        samesite=same_site,
    )

def clear_auth_cookie(response: Response):
    name = os.getenv("AUTH_COOKIE_NAME", "azor_access")
    domain = os.getenv("COOKIE_DOMAIN") or None
    response.delete_cookie(key=name, path="/", domain=domain, httponly=True)
