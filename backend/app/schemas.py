
from pydantic import BaseModel, EmailStr, UUID4, ConfigDict
from typing import Optional, Literal

Role = Literal["AZOR", "COVENANT"]

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

class ReferralCreate(BaseModel):
    company: str
    contact_name: str
    contact_email: EmailStr
    contact_phone: str
    notes: Optional[str] = None

class ReferralOut(BaseModel):
    id: UUID4
    ref_no: str
    company: str
    status: str
    model_config = ConfigDict(from_attributes=True)
