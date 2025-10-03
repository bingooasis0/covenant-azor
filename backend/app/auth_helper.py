
# app/auth_helper.py
from typing import Optional, Tuple
from fastapi import HTTPException, status
import jwt  # PyJWT
from .config import settings

def bearer_sub_and_role(authorization: Optional[str]) -> Tuple[str, Optional[str]]:
    """Parse Authorization: Bearer <jwt> and return (sub, role)."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    sub = payload.get("sub")
    role = payload.get("role")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return sub, role
