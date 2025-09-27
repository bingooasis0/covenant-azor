# app/routers/users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models, schemas, utils
from app.security.permissions import require_auth
from app.audit_helper import write_audit

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/change-password")
def change_password(payload: dict, auth=Depends(require_auth), db: Session = Depends(get_db)):
    sub, role = auth
    old_password = (payload.get("old_password") or "").strip()
    new_password = (payload.get("new_password") or "").strip()
    if len(new_password) < 15:
        raise HTTPException(status_code=400, detail="new_password must be >= 15 chars")
    u = db.query(models.User).filter(models.User.id==sub).first()
    if not u: raise HTTPException(status_code=404, detail="Not found")
    if not utils.verify_password(old_password, u.hashed_password):
        raise HTTPException(status_code=400, detail="old_password invalid")
    u.hashed_password = utils.hash_password(new_password)
    db.add(u); db.commit()
    write_audit(db, sub, "change_password", "user", str(u.id))
    return {"ok": True}

# Users cannot change email via public endpoint. Admin has separate endpoints.
