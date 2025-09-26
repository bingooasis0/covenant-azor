
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.auth_helper import bearer_sub_and_role
from app.graph_mail import send_mail

router = APIRouter()

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

@router.post("/contact")
def contact(payload: dict, authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    sub, role = bearer_sub_and_role(authorization)
    if not sub: raise HTTPException(status_code=401, detail="Unauthorized")
    msg = payload.get("message") or ""
    if not msg.strip(): raise HTTPException(status_code=400, detail="Empty message")
    try:
        send_mail(["A-ZReferrals@covenanttechnology.net"], "Agent message", msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"send failed: {e}")
    return {"ok": True}
