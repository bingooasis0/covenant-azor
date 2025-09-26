# app/routers/users.py
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models, schemas, utils
from app.auth_helper import bearer_sub_and_role

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---- Admin-lite create (you already use Admin endpoints for full CRUD) ----
@router.post("/", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="User already exists")
    u = models.User(
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        hashed_password=utils.hash_password(user.password),
        role=user.role,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u

# ---- Account: change password (authenticated) ----
@router.post("/change-password")
def change_password(
    payload: dict,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    sub, _role = bearer_sub_and_role(authorization)
    if not sub:
        raise HTTPException(status_code=401, detail="Unauthorized")

    old = (payload or {}).get("old_password") or ""
    new = (payload or {}).get("new_password") or ""
    if len(new) < 15:
        raise HTTPException(status_code=400, detail="Password must be at least 15 characters")

    u = db.query(models.User).filter(models.User.id == sub).first()
    if not u or not utils.verify_password(old, u.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid current password")

    u.hashed_password = utils.hash_password(new)
    db.add(u)
    db.commit()
    return {"ok": True}

# ---- Account: reset MFA seed (authenticated; noop placeholder) ----
@router.post("/mfa/reset")
def mfa_reset(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    sub, _role = bearer_sub_and_role(authorization)
    if not sub:
        raise HTTPException(status_code=401, detail="Unauthorized")
    # placeholder: clear user's MFA secret when TOTP is implemented
    return {"ok": True}
