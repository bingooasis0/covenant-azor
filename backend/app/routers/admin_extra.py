from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db import get_session

try:
    from passlib.hash import bcrypt
except Exception:
    bcrypt = None

router = APIRouter(prefix="/admin", tags=["admin"])

class ResetPasswordPayload(BaseModel):
    new_password: str

# POST /admin/users/{user_id}/reset-password
@router.post("/users/{user_id}/reset-password")
def admin_reset_password(user_id: str, payload: ResetPasswordPayload, db: Session = Depends(get_session)):
    if not payload.new_password or len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="new_password too short")
    if bcrypt is None:
        raise HTTPException(status_code=500, detail="bcrypt not available on server")

    hashed = bcrypt.hash(payload.new_password)
    res = db.execute(
        text("UPDATE users SET password_hash = :hp WHERE id = :id"),
        {"hp": hashed, "id": user_id},
    )
    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="User not found")

    db.commit()
    return {"ok": True}
