
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
import pyotp, qrcode, io, base64, secrets
from app.database import SessionLocal
from app.auth_helper import bearer_sub_and_role
from app.mfa_models import MFACredential
from app.audit_helper import write_audit

router = APIRouter()

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def _issuer(): return "CovenantAzor"

@router.post("/setup")
def setup(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    sub, _ = bearer_sub_and_role(authorization)
    if not sub: raise HTTPException(status_code=401, detail="Unauthorized")
    cred = db.query(MFACredential).filter(MFACredential.user_id==sub).first()
    if not cred:
        secret = pyotp.random_base32()
        codes = [secrets.token_hex(4) for _ in range(8)]
        cred = MFACredential(user_id=sub, secret=secret, enabled=False, recovery_codes=codes)
        db.add(cred); db.commit(); db.refresh(cred)
    totp = pyotp.TOTP(cred.secret)
    uri = totp.provisioning_uri(name=sub, issuer_name=_issuer())
    img = qrcode.make(uri); buf = io.BytesIO(); img.save(buf, format="PNG")
    qr_data = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
    write_audit(db, sub, "mfa_setup", "user", str(sub))
    return {"otpauth_url": uri, "qr": qr_data, "recovery_codes": cred.recovery_codes}

@router.post("/verify")
def verify(payload: dict, authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    sub, _ = bearer_sub_and_role(authorization)
    if not sub: raise HTTPException(status_code=401, detail="Unauthorized")
    code = (payload or {}).get("code","")
    cred = db.query(MFACredential).filter(MFACredential.user_id==sub).first()
    if not cred: raise HTTPException(status_code=400, detail="No setup in progress")
    if not pyotp.TOTP(cred.secret).verify(code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid code")
    cred.enabled = True; db.add(cred); db.commit()
    write_audit(db, sub, "mfa_verify", "user", str(sub))
    write_audit(db, sub, "mfa_reset_self", "user", str(sub))
    return {"ok": True}

@router.post("/reset")
def reset(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    sub, _ = bearer_sub_and_role(authorization)
    if not sub: raise HTTPException(status_code=401, detail="Unauthorized")
    cred = db.query(MFACredential).filter(MFACredential.user_id==sub).first()
    secret = pyotp.random_base32()
    import secrets as s
    codes = [s.token_hex(4) for _ in range(8)]
    if cred:
        cred.secret = secret; cred.enabled=False; cred.recovery_codes = codes; db.add(cred); db.commit()
    else:
        db.add(MFACredential(user_id=sub, secret=secret, enabled=False, recovery_codes=codes)); db.commit()
    write_audit(db, sub, "mfa_reset_self", "user", str(sub))
    return {"ok": True}
