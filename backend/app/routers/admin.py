
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import SessionLocal
from app import models, schemas
from app.auth_helper import bearer_sub_and_role
from app.graph_mail import send_mail
from sqlalchemy import desc

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

# USERS
@router.get("/users")
def list_users(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    require_admin(authorization)
    return db.query(models.User).order_by(models.User.created_at.desc()).all()

@router.post("/users", response_model=schemas.UserOut)
def create_user(u: schemas.UserCreate, authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    require_admin(authorization)
    existing = db.query(models.User).filter(models.User.email == u.email).first()
    if existing: raise HTTPException(status_code=400, detail="User exists")
    from app.utils import hash_password
    dbu = models.User(email=u.email, first_name=u.first_name, last_name=u.last_name, hashed_password=hash_password(u.password), role=u.role)
    db.add(dbu); db.commit(); db.refresh(dbu); return dbu

@router.delete("/users/{user_id}")
def delete_user(user_id: str, authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    require_admin(authorization)
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u: raise HTTPException(status_code=404, detail="Not found")
    db.delete(u); db.commit(); return {"ok": True}

# REFERRALS
@router.get("/referrals")
def list_referrals(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    require_admin(authorization)
    rs = db.query(models.Referral).order_by(desc(models.Referral.created_at)).limit(100).all()
    return rs

@router.patch("/referrals/{ref_id}")
def update_referral(ref_id: str, payload: dict, authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    require_admin(authorization)
    r = db.query(models.Referral).filter(models.Referral.id == ref_id).first()
    if not r: raise HTTPException(status_code=404, detail="Not found")
    status = payload.get("status")
    notes = payload.get("notes")
    if status: r.status = status
    if notes is not None: r.notes = notes
    db.add(r); db.commit(); db.refresh(r)
    return r

@router.post("/referrals/{ref_id}/note")
def admin_add_note(ref_id: str, payload: dict, authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    require_admin(authorization)
    r = db.query(models.Referral).filter(models.Referral.id == ref_id).first()
    if not r: raise HTTPException(status_code=404, detail="Not found")
    note = payload.get("note")
    if not note: raise HTTPException(status_code=400, detail="note required")
    # append to notes field simple for now
    r.notes = (r.notes + " | " if r.notes else "") + note
    db.add(r); db.commit(); return {"ok": True}

@router.post("/referrals/{ref_id}/email")
def admin_email(ref_id: str, payload: dict, authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    require_admin(authorization)
    r = db.query(models.Referral).filter(models.Referral.id == ref_id).first()
    if not r: raise HTTPException(status_code=404, detail="Not found")
    subject = payload.get("subject") or f"Update on referral {r.ref_no or r.id}"
    body = payload.get("body") or ""
    to = payload.get("to") or r.contact_email
    try:
        send_mail([to], subject, body)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"send failed: {e}")
    return {"ok": True}
