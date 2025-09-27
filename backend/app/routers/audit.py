# backend/app/routers/audit.py
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import SessionLocal
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

@router.get("/events")
def events(limit: int = Query(50, ge=1, le=500), offset: int = Query(0, ge=0), authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
  try:
    require_admin(authorization)
  except Exception:
    return []
  rows = db.execute(text("""    SELECT e.id,
           e.actor_user_id,
           u.first_name AS actor_first_name,
           u.last_name  AS actor_last_name,
           u.email      AS actor_email,
           e.action,
           e.entity_type,
           e.entity_id,
           e.created_at
    FROM audit_event e
    LEFT JOIN users u ON u.id = e.actor_user_id
    ORDER BY e.created_at DESC
    LIMIT :lim OFFSET :off
  """), {"lim": limit, "off": offset}).mappings().all()
  return rows
