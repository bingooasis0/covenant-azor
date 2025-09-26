
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import text
from app import models, schemas
from app.database import SessionLocal
from app.auth_helper import bearer_sub_and_role
from app.graph_mail import send_mail

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def _ensure_seq(db: Session):
    db.execute(text("CREATE SEQUENCE IF NOT EXISTS referral_seq;"))
    db.commit()

def _next_ref_no(db: Session):
    _ensure_seq(db)
    year = text("extract(year from now())::int")
    seq_val = db.execute(text("SELECT nextval('referral_seq')")).scalar_one()
    return f"AZR-{db.execute(text('SELECT ' + str(year))).scalar_one()}-{int(seq_val):04d}"

@router.post("/", response_model=schemas.ReferralOut)
def create_referral(ref: schemas.ReferralCreate, authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    sub, role = bearer_sub_and_role(authorization)
    if not sub:
        raise HTTPException(status_code=401, detail="Unauthorized")

    db_ref = models.Referral(
        company=ref.company,
        contact_name=ref.contact_name,
        contact_email=ref.contact_email,
        contact_phone=ref.contact_phone,
        notes=ref.notes,
        status="New",
        agent_id=sub,
    )
    db.add(db_ref)
    db.commit()
    db.refresh(db_ref)

    # assign ref_no after id exists
    db_ref.ref_no = _next_ref_no(db)
    db.add(db_ref); db.commit(); db.refresh(db_ref)
    return db_ref

@router.get("/my", response_model=list[schemas.ReferralOut])
def list_my(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    sub, role = bearer_sub_and_role(authorization)
    if not sub:
        raise HTTPException(status_code=401, detail="Unauthorized")
    q = db.query(models.Referral).filter(models.Referral.agent_id == sub).order_by(models.Referral.created_at.desc()).limit(25)
    return q.all()

@router.post("/{referral_id}/agent-note")
def agent_note(referral_id: str, note: str, authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    sub, role = bearer_sub_and_role(authorization)
    if not sub:
        raise HTTPException(status_code=401, detail="Unauthorized")

    ref_obj = db.query(models.Referral).filter(models.Referral.id == referral_id, models.Referral.agent_id == sub).first()
    if not ref_obj:
        raise HTTPException(status_code=404, detail="Referral not found")

    subject = f"Azor Note • {ref_obj.ref_no or ref_obj.id} • {ref_obj.company}"
    body = f"Agent note from referral {ref_obj.ref_no or ref_obj.id}\nCompany: {ref_obj.company}\nAgent user id: {sub}\n\nNote:\n{note}"
    try:
        send_mail(["A-ZReferrals@covenanttechnology.net", ref_obj.contact_email], subject, body)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email send failed: {e}")
    return {"ok": True}
