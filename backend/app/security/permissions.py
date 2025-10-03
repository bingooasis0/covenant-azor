# app/security/permissions.py
from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.auth_helper import bearer_sub_and_role

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def require_auth(authorization: str | None = Header(default=None)) -> tuple[str, str]:
    sub, role = bearer_sub_and_role(authorization)
    if not sub:
        raise HTTPException(status_code=401, detail="Unauthorized")
    if role not in ("AZOR", "COVENANT"):
        role = "AZOR"
    return sub, role

def require_admin(authorization: str | None = Header(default=None)) -> str:
    sub, role = bearer_sub_and_role(authorization)
    if role != "COVENANT":
        raise HTTPException(status_code=403, detail="Admin only")
    return sub

def require_azor(authorization: str | None = Header(default=None)) -> str:
    sub, role = bearer_sub_and_role(authorization)
    if role != "AZOR":
        raise HTTPException(status_code=403, detail="AZOR only")
    return sub
