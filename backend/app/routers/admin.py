from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db import get_session

router = APIRouter()

@router.get("/users")
def list_users(db: Session = Depends(get_session)):
    rows = db.execute(
        text("SELECT id, email, first_name, last_name, role FROM users ORDER BY created_at DESC")
    ).all()
    return [dict(r._mapping) for r in rows]
