from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
from app.auth_helper import bearer_sub_and_role

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def require_admin(authorization: str | None):
    sub, role = bearer_sub_and_role(authorization)
    if role != "COVENANT":
        raise HTTPException(status_code=403, detail="Admin only")
    return sub

@router.patch("/users/{user_id}")
def admin_update_user(user_id: str, payload: dict, authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    require_admin(authorization)
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Not found")
    # Allow updates for: email, first_name, last_name, role
    for field in ["email", "first_name", "last_name", "role"]:
        if field in payload and payload[field]:
            setattr(u, field, payload[field])
    db.add(u); db.commit(); db.refresh(u)
    return {"id": str(u.id), "email": u.email, "first_name": u.first_name, "last_name": u.last_name, "role": u.role}

@router.post("/users/{user_id}/reset-password")
def admin_reset_password(user_id: str, payload: dict, authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    require_admin(authorization)
    new_password = payload.get("new_password")
    if not new_password or len(new_password) < 15:
        raise HTTPException(status_code=400, detail="new_password >= 15 chars required")
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Not found")
    from app import utils
    u.hashed_password = utils.hash_password(new_password)
    db.add(u); db.commit()
    return {"ok": True}

@router.post("/users/{user_id}/mfa/reset")
def admin_reset_mfa(user_id: str, authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    require_admin(authorization)
    from app.mfa_models import MFACredential
    import pyotp, secrets as s
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Not found")
    secret = pyotp.random_base32()
    codes = [s.token_hex(4) for _ in range(8)]
    cred = db.query(MFACredential).filter(MFACredential.user_id==u.id).first()
    if cred:
        cred.secret = secret; cred.enabled=False; cred.recovery_codes = codes; db.add(cred); db.commit()
    else:
        db.add(MFACredential(user_id=u.id, secret=secret, enabled=False, recovery_codes=codes)); db.commit()
    return {"ok": True}
