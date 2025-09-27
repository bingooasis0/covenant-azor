# backend/app/schemas.py
from pydantic import BaseModel, EmailStr, UUID4, ConfigDict
from typing import Optional, Literal, List, Dict, Any
from datetime import datetime

Role = Literal["AZOR", "COVENANT"]

# ---------- Users ----------

class UserCreate(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    password: str
    role: Role = "AZOR"

class UserOut(BaseModel):
    id: UUID4
    email: EmailStr
    first_name: str
    last_name: str
    role: Role
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Role

# ---------- Referrals ----------

class ReferralCreate(BaseModel):
    company: str
    contact_name: str
    contact_email: EmailStr
    contact_phone: str
    opportunity_types: List[str] = []
    opportunity_other: Optional[str] = None
    environment: Dict[str, Any] = {}
    locations: List[str] = []
    reason: Optional[str] = None
    scope: Dict[str, Any] = {}
    notes: Optional[str] = None

class ReferralOut(BaseModel):
    id: UUID4
    ref_no: str
    company: str
    status: str
    created_at: Optional[datetime] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    notes: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)
