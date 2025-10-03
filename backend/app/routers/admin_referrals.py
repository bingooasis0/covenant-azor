
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
import json

from app.dependencies import get_db, require_admin

router = APIRouter(prefix="/admin/referrals", tags=["admin-referrals"])

@router.get("")
def admin_list_referrals(
    admin = Depends(require_admin),
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    rows = db.execute(
        text("""
            SELECT id, ref_no, company, status, created_at, contact_name, contact_email,
                   contact_phone, notes, agent_id, opportunity_types, locations, environment, reason
              FROM referrals
             ORDER BY created_at DESC
             LIMIT :lim OFFSET :off
        """),
        {"lim": limit, "off": offset},
    ).mappings().all()
    next_token = None if len(rows) < limit else str(offset + limit)
    return {"items": rows, "next": next_token}

class AdminReferralUpdate(BaseModel):
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
    agent_id: Optional[str] = None

@router.patch("/{referral_id}")
def admin_update_referral(referral_id: str, payload: AdminReferralUpdate, admin=Depends(require_admin), db: Session = Depends(get_db)):
    sets, params = [], {"id": referral_id}
    def add(col, val, jsonb=False):
        if val is not None:
            if jsonb:
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
    add("agent_id", payload.agent_id)

    if not sets:
        raise HTTPException(status_code=400, detail="No fields to update")

    row = db.execute(
        text(f"""
            UPDATE referrals SET {", ".join(sets)}
             WHERE id = :id
         RETURNING id, ref_no, company, status, created_at, contact_name, contact_email,
                   contact_phone, notes, agent_id, opportunity_types, locations, environment, reason
        """),
        params,
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Referral not found")

    db.execute(
        text("""INSERT INTO audit_event (actor_user_id, action, entity_type, entity_id)
                VALUES (:uid, 'admin.referral.updated', 'referral', :entity_id)"""),
        {"uid": admin[0], "entity_id": referral_id},
    )
    db.commit()
    return row

@router.delete("/{referral_id}", status_code=200)
def admin_delete_referral(referral_id: str, admin=Depends(require_admin), db: Session = Depends(get_db)):
    deleted = db.execute(text("DELETE FROM referrals WHERE id = :id"), {"id": referral_id}).rowcount
    if not deleted:
        raise HTTPException(status_code=404, detail="Referral not found")

    db.execute(
        text("""INSERT INTO audit_event (actor_user_id, action, entity_type, entity_id)
                VALUES (:uid, 'admin.referral.deleted', 'referral', :entity_id)"""),
        {"uid": admin[0], "entity_id": referral_id},
    )
    db.commit()
    return {"ok": True}
