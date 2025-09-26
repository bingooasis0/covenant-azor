
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
from app import models, schemas
from app.database import SessionLocal
from app.auth_helper import bearer_sub_and_role
from app.graph_mail import send_mail

router = APIRouter()

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def _ensure_seq(db: Session):
    db.execute(text("CREATE SEQUENCE IF NOT EXISTS referral_seq;"))
    db.commit()

def _next_ref_no(db: Session):
    _ensure_seq(db)
    seq_val = db.execute(text("SELECT nextval('referral_seq')")).scalar_one()
    year = datetime.utcnow().year
    return f"AZR-{year}-{int(seq_val):04d}"

@router.post("/", response_model=schemas.ReferralOut)
def create_referral(ref: schemas.ReferralCreate, authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    sub, role = bearer_sub_and_role(authorization)
    if not sub: raise HTTPException(status_code=401, detail="Unauthorized")
    r = models.Referral(
        company=ref.company, contact_name=ref.contact_name, contact_email=ref.contact_email,
        contact_phone=ref.contact_phone, notes=ref.notes, status="New", agent_id=sub
    )
    db.add(r); db.commit(); db.refresh(r)
    r.ref_no = _next_ref_no(db); db.add(r); db.commit(); db.refresh(r)
    # notify Covenant
    send_mail(["A-ZReferrals@covenanttechnology.net"], f"New referral {r.ref_no}", f"{ref.company} from agent {sub}")
    return r

@router.get("/my", response_model=list[schemas.ReferralOut])
def list_my(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    sub, role = bearer_sub_and_role(authorization)
    if not sub: raise HTTPException(status_code=401, detail="Unauthorized")
    return db.query(models.Referral).filter(models.Referral.agent_id==sub).order_by(models.Referral.created_at.desc()).limit(50).all()

@router.post("/{referral_id}/agent-note")
def agent_note(referral_id: str, note: str, authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    sub, role = bearer_sub_and_role(authorization)
    if not sub: raise HTTPException(status_code=401, detail="Unauthorized")
    r = db.query(models.Referral).filter(models.Referral.id==referral_id, models.Referral.agent_id==sub).first()
    if not r: raise HTTPException(status_code=404, detail="Referral not found")
    send_mail(["A-ZReferrals@covenanttechnology.net"], f"Azor Note • {r.ref_no} • {r.company}", note)
    return {"ok": True}
