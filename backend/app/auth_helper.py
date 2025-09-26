
from fastapi import HTTPException, Header
from jose import jwt, JWTError
from app.config import settings

def bearer_sub_and_role(authorization: str | None):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization")
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization")
    try:
        payload = jwt.decode(parts[1], settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload.get("sub"), payload.get("role")
