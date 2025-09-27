# backend/app/routers/admin.py
from typing import List
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import SessionLocal
from app import models, schemas, utils
from app.auth_helper import bearer_sub_and_role
from app.graph_mail import send_mail
from app.audit_helper import write_audit

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

# ---------- USERS ----------

@router.get("/users", response_model=List[schemas.UserOut])
def list_users(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    admin = require_admin(authorization)
    rows = db.query(models.User).order_by(models.User.created_at.desc()).all()
    write_audit(db, admin, "admin_list_users", "user", None)
    return rows

@router.post("/users", response_model=schemas.UserOut)
def create_user(u: schemas.UserCreate, authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    admin = require_admin(authorization)
    if db.query(models.User).filter(models.User.email == u.email).first():
        raise HTTPException(status_code=400, detail="User exists")
    x = models.User(
        email=u.email,
        first_name=u.first_name,
        last_name=u.last_name,
        hashed_password=utils.hash_password(u.password),
        role=u.role,
    )
    db.add(x); db.commit(); db.refresh(x)
    write_audit(db, admin, "admin_create_user", "user", str(x.id))
    return x

@router.delete("/users/{user_id}")
def delete_user(user_id: str, authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    admin = require_admin(authorization)
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(u); db.commit()
    write_audit(db, admin, "admin_delete_user", "user", user_id)
    return {"ok": True}

@router.post("/users/{user_id}/reset-password")
def admin_reset_password(user_id: str, payload: dict, authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    admin = require_admin(authorization)
    new_password = (payload.get("new_password") or "").strip()
    if len(new_password) < 15:
        raise HTTPException(status_code=400, detail="new_password must be >= 15 chars")
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Not found")
    u.hashed_password = utils.hash_password(new_password)
    db.add(u); db.commit()
    write_audit(db, admin, "admin_reset_password", "user", user_id)
    return {"ok": True}

@router.post("/users/{user_id}/mfa/reset")
def admin_reset_mfa(user_id: str, authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    admin = require_admin(authorization)
    from app.mfa_models import MFACredential
    import pyotp, secrets as s
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Not found")
    secret = pyotp.random_base32()
    codes = [s.token_hex(4) for _ in range(8)]
    cred = db.query(MFACredential).filter(MFACredential.user_id == u.id).first()
    if cred:
        cred.secret = secret; cred.enabled = False; cred.recovery_codes = codes; db.add(cred); db.commit()
    else:
        db.add(MFACredential(user_id=u.id, secret=secret, enabled=False, recovery_codes=codes)); db.commit()
    write_audit(db, admin, "admin_reset_mfa", "user", user_id)
    return {"ok": True}

# ---------- REFERRALS ----------

@router.get("/referrals", response_model=List[schemas.ReferralOut])
def list_referrals(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    admin = require_admin(authorization)
    rows = db.query(models.Referral).order_by(desc(models.Referral.created_at)).all()
    write_audit(db, admin, "admin_list_referrals", "referral", None)
    return rows

@router.patch("/referrals/{ref_id}", response_model=schemas.ReferralOut)
def update_referral(ref_id: str, payload: dict, authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    admin = require_admin(authorization)
    r = db.query(models.Referral).filter(models.Referral.id == ref_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Not found")
    if "status" in payload: r.status = payload["status"]
    if "notes" in payload:  r.notes  = payload["notes"]
    db.add(r); db.commit(); db.refresh(r)
    write_audit(db, admin, "admin_patch_referral", "referral", ref_id)
    return r

@router.delete("/referrals/{ref_id}")
def admin_delete_referral(ref_id: str, authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    admin = require_admin(authorization)
    r = db.query(models.Referral).filter(models.Referral.id == ref_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(r); db.commit()
    write_audit(db, admin, "admin_delete_referral", "referral", ref_id)
    return {"ok": True}

@router.post("/referrals/{ref_id}/delete")
def admin_delete_referral_fallback(ref_id: str, authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    return admin_delete_referral(ref_id, authorization, db)

@router.post("/referrals/{ref_id}/note")
def admin_add_note(ref_id: str, payload: dict, authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    admin = require_admin(authorization)
    r = db.query(models.Referral).filter(models.Referral.id == ref_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Not found")
    note = payload.get("note")
    if not note:
        raise HTTPException(status_code=400, detail="note required")
    r.notes = (r.notes + " | " if r.notes else "") + note
    db.add(r); db.commit()
    write_audit(db, admin, "admin_add_note", "referral", ref_id)
    return {"ok": True}

@router.post("/referrals/{ref_id}/email")
def admin_email(ref_id: str, payload: dict, authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    admin = require_admin(authorization)
    r = db.query(models.Referral).filter(models.Referral.id == ref_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Not found")
    subject = payload.get("subject") or f"Update on referral {r.ref_no or r.id}"
    body    = payload.get("body") or ""
    to      = payload.get("to")   or r.contact_email
    send_mail([to], subject, body)
    write_audit(db, admin, "admin_email_referral", "referral", ref_id)
    return {"ok": True}
