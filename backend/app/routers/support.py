
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.auth_helper import bearer_sub_and_role
from app.graph_mail import send_mail
from pydantic import BaseModel
import os, datetime

router = APIRouter()
router = APIRouter(prefix="/support", tags=["support"])

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
    send_mail(["A-ZReferrals@covenanttechnology.net"], "Agent message", msg)
    return {"ok": True}

class FeedbackIn(BaseModel):
  message: str

@router.post("/feedback")
def submit_feedback(body: FeedbackIn):
  msg = body.message.strip()
  if not msg:
    raise HTTPException(status_code=400, detail="Empty feedback")
  # 1) Log to file for audit
  os.makedirs("data", exist_ok=True)
  with open(os.path.join("data", "feedback.log"), "a", encoding="utf-8") as f:
    f.write(f"[{datetime.datetime.utcnow().isoformat()}Z] {msg}\n")

  # 2) OPTIONAL: send email via your existing Graph helper if available
  # send_mail("colby@covenanttechnology.net", subject="Portal feedback", body=msg)

  return {"ok": True}