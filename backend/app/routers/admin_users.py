# backend/app/routers/admin_users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, constr
from app.db import get_db
from app.models import User  # adjust to your model location
from app.services.auth import require_admin  # adjust
from app.services.security import hash_password  # adjust
from app.services.mfa import reset_mfa_for_user  # adjust or call your existing function

class CreateUser(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: constr(regex="^(AZOR|COVENANT)$")
    password: constr(min_length=15)

class ResetPass(BaseModel):
    new_password: constr(min_length=15)

router = APIRouter(prefix="/admin/users", tags=["admin-users"])

@router.post("/{user_id}/reset-password")
def reset_password(user_id: str, body: ResetPass, db: Session = Depends(get_db), admin=Depends(require_admin)):
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.hashed_password = hash_password(body.new_password)
    db.add(user)
    db.commit()
    return {"ok": True}

@router.post("/{user_id}/mfa/reset")
def admin_mfa_reset(user_id: str, db: Session = Depends(get_db), admin=Depends(require_admin)):
    reset_mfa_for_user(db, user_id)
    db.commit()
    return {"ok": True}

@router.post("")
def create_user(body: CreateUser, db: Session = Depends(get_db), admin=Depends(require_admin)):
    exists = db.query(User).filter(User.email == body.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email already exists")
    user = User(email=body.email, first_name=body.first_name, last_name=body.last_name, role=body.role, hashed_password=hash_password(body.password))
    db.add(user); db.commit(); db.refresh(user)
    return {"id": str(user.id)}
