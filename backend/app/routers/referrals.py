from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import text
import json

from app.dependencies import get_db, require_auth

router = APIRouter(prefix="/referrals", tags=["referrals"])


class ReferralCreate(BaseModel):
    company: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    notes: Optional[str] = None
    opportunity_types: List[str] = Field(default_factory=list)
    locations: List[str] = Field(default_factory=list)
    environment: Dict[str, Any] = Field(default_factory=dict)
    reason: Optional[str] = None


class ReferralUpdate(BaseModel):
    company: Optional[str] = None
    status: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    notes: Optional[str] = None
    opportunity_types: Optional[List[str]] = None
    locations: Optional[List[str]] = None
    environment: Optional[Dict[str, Any]] = None
    reason: Optional[str] = None


@router.get("/my")
def list_my_referrals(
    auth=Depends(require_auth),
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """
    Returns **array only** of current user's referrals.
    """
    user_id, _role = auth
    rows = db.execute(
        text(
            """
            SELECT id, ref_no, company, status, created_at,
                   contact_name, contact_email, contact_phone,
                   notes, agent_id, opportunity_types, locations, environment, reason
              FROM referrals
             WHERE agent_id = :uid
             ORDER BY created_at DESC
             LIMIT :lim OFFSET :off
            """
        ),
        {"uid": user_id, "lim": limit, "off": offset},
    ).mappings().all()

    # Return array only for FE simplicity
    return [dict(r) for r in rows]


@router.post("", status_code=200)
def create_referral(
    payload: ReferralCreate, auth=Depends(require_auth), db: Session = Depends(get_db)
):
    """
    Insert referral using **safe JSON casting**. Avoids the mixed param-style bug that produced
    `:opportunity_types::jsonb` and 500s.
    """
    user_id, _role = auth

    # Generate next ref_no with retry logic for race conditions
    from sqlalchemy.exc import IntegrityError
    import random
    import time

    row = None
    max_attempts = 10

    for attempt in range(max_attempts):
        # Get the latest ref_no
        max_ref = db.execute(
            text("SELECT ref_no FROM referrals WHERE ref_no LIKE 'AZR-2025-%' ORDER BY ref_no DESC LIMIT 1")
        ).scalar()

        if max_ref:
            try:
                num = int(max_ref.split('-')[-1]) + 1
            except:
                num = 1
        else:
            num = 1

        ref_no = f"AZR-2025-{num:04d}"

        try:
            # Try to insert with this ref_no
            row = db.execute(
                text(
                    """
                    INSERT INTO referrals (
                        ref_no, company, status, contact_name, contact_email, contact_phone, notes,
                        agent_id, opportunity_types, locations, environment, reason
                    ) VALUES (
                        :ref_no, :company, 'new', :contact_name, :contact_email, :contact_phone, :notes,
                        :agent_id, CAST(:opportunity_types AS JSONB), CAST(:locations AS JSONB), CAST(:environment AS JSONB), :reason
                    )
                    RETURNING id, ref_no, company, status, created_at, contact_name, contact_email,
                              contact_phone, notes, agent_id, opportunity_types, locations, environment, reason
                    """
                ),
                {
                    "ref_no": ref_no,
                    "company": payload.company,
                    "contact_name": payload.contact_name,
                    "contact_email": payload.contact_email,
                    "contact_phone": payload.contact_phone,
                    "notes": payload.notes,
                    "agent_id": user_id,
                    "opportunity_types": json.dumps(payload.opportunity_types or []),
                    "locations": json.dumps(payload.locations or []),
                    "environment": json.dumps(payload.environment or {}),
                    "reason": payload.reason,
                },
            ).mappings().first()
            # Success - break out of retry loop
            break
        except IntegrityError as e:
            # Duplicate ref_no - rollback and retry
            db.rollback()
            if attempt < max_attempts - 1:
                time.sleep(random.uniform(0.01, 0.05))
                continue
            else:
                # Last attempt failed, re-raise
                raise

    if not row:
        raise HTTPException(status_code=500, detail="Failed to create referral after multiple attempts")

    db.execute(
        text(
            """INSERT INTO audit_event (actor_user_id, action, entity_type, entity_id)
               VALUES (:uid, :action, :entity_type, :entity_id)"""
        ),
        {
            "uid": user_id,
            "action": "referral.created",
            "entity_type": "referral",
            "entity_id": str(row['id']),
        },
    )
    db.commit()
    return dict(row)


@router.patch("/{referral_id}")
def update_referral(
    referral_id: str,
    payload: ReferralUpdate,
    auth=Depends(require_auth),
    db: Session = Depends(get_db),
):
    user_id, role = auth

    owner = db.execute(
        text("SELECT agent_id FROM referrals WHERE id = :id"), {"id": referral_id}
    ).scalar()
    if not owner:
        raise HTTPException(status_code=404, detail="Referral not found")
    if role != "COVENANT" and owner != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    sets, params = [], {"id": referral_id}

    def add(col: str, val, jsonb: bool = False):
        if val is not None:
            if jsonb:
                # Use CAST(:param AS JSONB) to avoid the colon+cast parsing bug
                sets.append(f"{col} = CAST(:{col} AS JSONB)")
                params[col] = json.dumps(val)
            else:
                sets.append(f"{col} = :{col}")
                params[col] = val

    add("company", payload.company)
    add("status", payload.status)
    add("contact_name", payload.contact_name)
    add("contact_email", payload.contact_email)
    add("contact_phone", payload.contact_phone)
    add("notes", payload.notes)
    add("opportunity_types", payload.opportunity_types, jsonb=True)
    add("locations", payload.locations, jsonb=True)
    add("environment", payload.environment, jsonb=True)
    add("reason", payload.reason)

    if not sets:
        raise HTTPException(status_code=400, detail="No fields to update")

    row = db.execute(
        text(
            f"""
            UPDATE referrals SET {", ".join(sets)}
             WHERE id = :id
         RETURNING id, ref_no, company, status, created_at, contact_name, contact_email,
                   contact_phone, notes, agent_id, opportunity_types, locations, environment, reason
        """
        ),
        params,
    ).mappings().first()

    db.execute(
        text(
            """INSERT INTO audit_event (actor_user_id, action, entity_type, entity_id)
               VALUES (:uid, 'referral.updated', 'referral', :entity_id)"""
        ),
        {
            "uid": user_id,
            "entity_id": referral_id,
        },
    )
    db.commit()
    return dict(row)
