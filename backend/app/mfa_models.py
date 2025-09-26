
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from app.database import Base

class MFACredential(Base):
    __tablename__ = "mfa_credential"
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    secret = Column(String, nullable=False)
    enabled = Column(Boolean, nullable=False, server_default="false")
    recovery_codes = Column(JSON, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
