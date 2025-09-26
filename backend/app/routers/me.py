
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from app.database import SessionLocal
from app.config import settings
from app import models, schemas

router = APIRouter()

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def _token(h: str | None):
    if not h: raise HTTPException(status_code=401, detail="Missing Authorization")
    p = h.split()
    if len(p)!=2 or p[0].lower()!="bearer": raise HTTPException(status_code=401, detail="Invalid Authorization")
    return p[1]

@router.get("/me", response_model=schemas.UserOut)
def me(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    t = _token(authorization)
    try:
        sub = jwt.decode(t, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]).get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    u = db.query(models.User).filter(models.User.id==sub).first()
    if not u: raise HTTPException(status_code=404, detail="Not found")
    return u
