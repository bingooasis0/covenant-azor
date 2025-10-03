# backend/app/routers/mfa_strict.py
from fastapi import APIRouter, HTTPException, Depends   # <-- add Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.db import get_session
import pyotp
from app.utils.mfa_policy import issuer
import bcrypt

router = APIRouter(prefix="/auth/mfa", tags=["auth-mfa"])

class SetupBody(BaseModel):
    username: EmailStr
    password: str

class EnableBody(BaseModel):
    username: EmailStr
    password: str
    otp: str

@router.post("/setup")
def mfa_setup(body: SetupBody, db: Session = Depends(get_session)):   # <-- use Depends
    # Verify password without issuing session
    row = db.execute(
        text("SELECT id, password_hash FROM users WHERE email=:e LIMIT 1"),
        {"e": body.username}
    ).first()
    if (not row) or (not row.password_hash) or (not bcrypt.checkpw(body.password.encode("utf-8"), row.password_hash.encode("utf-8"))):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    secret = pyotp.random_base32()
    db.execute(text("""
        INSERT INTO mfa_credential (id,user_id,secret,enabled,recovery_codes)
        VALUES (gen_random_uuid(), :uid, :sec, false, '[]'::jsonb)
        ON CONFLICT (user_id) DO UPDATE SET secret=:sec, enabled=false, recovery_codes='[]'::jsonb
    """), {"uid": row.id, "sec": secret})
    db.commit()

    uri = pyotp.TOTP(secret).provisioning_uri(name=str(body.username), issuer_name=issuer())
    return {"secret": secret, "otpauth_url": uri}

@router.post("/enable")
def mfa_enable(body: EnableBody, db: Session = Depends(get_session)):   # <-- use Depends
    row = db.execute(
        text("SELECT id, password_hash FROM users WHERE email=:e LIMIT 1"),
        {"e": body.username}
    ).first()
    if (not row) or (not row.password_hash) or (not bcrypt.checkpw(body.password.encode("utf-8"), row.password_hash.encode("utf-8"))):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    cred = db.execute(
        text("SELECT id, secret FROM mfa_credential WHERE user_id=:u LIMIT 1"),
        {"u": row.id}
    ).first()
    if not cred or not cred.secret:
        raise HTTPException(status_code=400, detail="MFA not initialized; call /auth/mfa/setup")

    totp = pyotp.TOTP(cred.secret)
    if not totp.verify(body.otp, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid code")

    db.execute(text("UPDATE mfa_credential SET enabled=true WHERE id=:id"), {"id": cred.id})
    db.commit()
    return {"enabled": True}
