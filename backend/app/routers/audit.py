
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import SessionLocal
from app.auth_helper import bearer_sub_and_role

router = APIRouter()

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def require_admin(authorization: str | None):
    sub, role = bearer_sub_and_role(authorization)
    if role != "COVENANT": raise HTTPException(status_code=403, detail="Admin only")
    return sub

@router.get("/events")
def events(limit: int = Query(50, ge=1, le=500), authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    # allow agents to see empty list without 401 for dashboard
    try:
        require_admin(authorization)
    except:
        return []
    rows = db.execute(text("SELECT id, actor_user_id, action, entity_type, entity_id, created_at FROM audit_event ORDER BY created_at DESC LIMIT :lim"), {"lim": limit}).mappings().all()
    return rows
