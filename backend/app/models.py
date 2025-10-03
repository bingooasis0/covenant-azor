# backend/app/models.py
from __future__ import annotations

import uuid as _uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Mapped, mapped_column

Base = declarative_base()

# --- Users ---
class User(Base):
    __tablename__ = "users"

    id: Mapped[_uuid.UUID] = mapped_column(postgresql.UUID(as_uuid=True), primary_key=True, default=_uuid.uuid4)
    email: Mapped[str] = mapped_column(sa.String(320), unique=True, index=True, nullable=False)
    first_name: Mapped[str] = mapped_column(sa.String(100), default="", nullable=False)
    last_name: Mapped[str] = mapped_column(sa.String(100), default="", nullable=False)
    role: Mapped[str] = mapped_column(sa.String(16), nullable=False)  # 'AZOR' | 'COVENANT'
    password_hash: Mapped[str | None] = mapped_column(sa.Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)


# --- Referrals ---
class Referral(Base):
    __tablename__ = "referrals"

    id: Mapped[_uuid.UUID] = mapped_column(postgresql.UUID(as_uuid=True), primary_key=True, default=_uuid.uuid4)
    ref_no: Mapped[str] = mapped_column(sa.Text, nullable=False, index=True)
    company: Mapped[str] = mapped_column(sa.Text, nullable=False)
    status: Mapped[str] = mapped_column(sa.Text, nullable=False, index=True)

    contact_name: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    contact_email: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(sa.Text, nullable=True)

    agent_id: Mapped[_uuid.UUID | None] = mapped_column(postgresql.UUID(as_uuid=True), nullable=True, index=True)

    # NEW JSONB/TEXT fields (Chunk A migration)
    opportunity_types: Mapped[dict | list | None] = mapped_column(postgresql.JSONB, nullable=True)
    locations: Mapped[dict | list | None] = mapped_column(postgresql.JSONB, nullable=True)
    environment: Mapped[dict | None] = mapped_column(postgresql.JSONB, nullable=True)
    reason: Mapped[str | None] = mapped_column(sa.Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)


# --- MFA Credential ---
class MFACredential(Base):
    __tablename__ = "mfa_credential"

    id: Mapped[_uuid.UUID] = mapped_column(postgresql.UUID(as_uuid=True), primary_key=True, default=_uuid.uuid4)
    user_id: Mapped[_uuid.UUID] = mapped_column(postgresql.UUID(as_uuid=True), nullable=False, index=True)
    secret: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    enabled: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, server_default=sa.false())
    recovery_codes: Mapped[sa.JSON | None] = mapped_column(postgresql.JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)


# --- Audit Event ---
class AuditEvent(Base):
    __tablename__ = "audit_event"

    id: Mapped[_uuid.UUID] = mapped_column(postgresql.UUID(as_uuid=True), primary_key=True, default=_uuid.uuid4)
    actor_user_id: Mapped[_uuid.UUID | None] = mapped_column(postgresql.UUID(as_uuid=True), nullable=True, index=True)
    action: Mapped[str] = mapped_column(sa.Text, nullable=False)
    entity_type: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    entity_id: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
